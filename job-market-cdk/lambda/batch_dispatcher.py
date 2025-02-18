import boto3
import logging
from openai import OpenAI
import os 
import json
import io
from datetime import datetime


logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

    
def handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    jobs_table = dynamodb.Table(os.environ['JOBS_TABLE'])
    batches_table = dynamodb.Table(os.environ['BATCHES_TABLE'])
    openai_client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])



    # read the data from DDB using internal_batch_group_id_xxx.. as the key
    # format the data as a jsonl file
    # upload to openai as a file
    # save file id of upload
    # make batch api call, using file id from openai 
    # save the batch id (from openai)
    # store [internal batch group id, open batch id, file id] in the batches table


    # init: jobs are stored waiting to upload to openai (handled by batch_dispatcher)
    # processing: the batch has been uploaded to openai and is currently being processed (handled by batch_poller)
    # completed: the batch has been downloaded from openai, and stored both in dynamo and mongo (done; can be deleted after a certain amount of time?)
    # retry: the batch upload to openai failed. needs to be attempted again (handled by batch_dispatcher)
    # failure: something went wrong; manual debugging (handled by ??? - create error handling lambda? - write errors to the table)
   
    statuses = ["init", "retry", "cancelled"]
    _status = 'init'

    try:
        for _status in statuses:
            response = batches_table.query(
                IndexName="StatusIndex",
                KeyConditionExpression='#status = :status',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':status': _status}
            )

            batches = response.get('Items', [])
            
            if not batches:
                logger.info(f"batch_poller: No {_status} batches found")
                continue

            logger.info(f"batch_poller: {len(batches)} batches with status {_status}: {batches}")
            
            # Process processing batches
            if _status == 'init':
                for batch in batches:
                    handle_init_batch(batch, batches_table, jobs_table, openai_client)
            
            elif _status == 'retry' or _status == 'cancelled':
                for batch in batches:
                    handle_retry_batch(batch, batches_table, openai_client)
        
    except Exception as e:
        logger.error(f"batch_dispatcher: Failed to query {_status} batches {e}")




# Creates a batch job in OpenAI; init batches only have the jobs in the Jobs Table and an internal_group_batch_id assigned
def handle_init_batch(batch, batches_table, jobs_table, openai_client):

    system_prompt = f"""Extract specific technical skills and tools mentioned in the following job description.

        - Output only a list of technical skills or tools explicitly mentioned, such as programming languages, frameworks, libraries, software tools, protocols, platforms, etc.
        - Do not include benefits, compensation details, years of experience, or general phrases unrelated to specific technologies or tools.
        - Only output the keywords as a single string separated by commas. Do not include context, explanations, intros, or outros.
        - If the job description is not clear or you cannot extract any keywords, output an empty string.
        Remember: Your output should be a single string of comma-separated technical skills and tools, or an empty string if you cannot extract any keywords. Nothing else.
    """

    logger.info(f"handle_init_batch: {batch}")

    # extract internal_batch_group_id
    internal_group_batch_id = batch['internal_group_batch_id']

    # Query jobs from DynamoDB using GSI
    try:
        jobs = []
        last_evaluated_key = None
        
        # Dynamo reads have max size of 1 mb; need to read
        while True:
            query_args = {
                'IndexName': 'InternalGroupBatchIndex',
                'KeyConditionExpression': 'internal_group_batch_id = :id',
                'ExpressionAttributeValues': {':id': internal_group_batch_id}
            }
            
            if last_evaluated_key:
                query_args['ExclusiveStartKey'] = last_evaluated_key

            response = jobs_table.query(**query_args)
            jobs.extend(response.get('Items', []))
            
            last_evaluated_key = response.get('LastEvaluatedKey')  # Safe get
            if not last_evaluated_key:
                break

        if not jobs:
            logger.info(f"batch_dispatcher: no jobs found for {internal_group_batch_id}")
            return 

        logger.info(f"batch_dispatcher: found {len(jobs)} jobs for {internal_group_batch_id}")
    
    except Exception as e:
        logger.error(f"batch_dispatcher: Failed to query jobs from dynamoDB: {e}")
        return





    # Format jobs as JSONL for OpenAI batch processing
    try:
        batch_payload = []
        for job in jobs:
            payload = {
                "custom_id": job['id'],
                "method": "POST", 
                "url": "/v1/chat/completions",
                "body": {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": system_prompt
                        },
                        {
                            "role": "user", 
                            "content": job['description']
                        }
                    ]
                }
            }
            batch_payload.append(payload)

        jsonl_payload = "\n".join(json.dumps(payload, separators=(',', ':')) for payload in batch_payload)

    except Exception as e:
        logger.error(f"batch_dispatcher: Failed to format jobs as JSONL: {e}")
        return






    # Convert json to bytes and upload to openAI
    try:
        bytes_io = io.BytesIO(jsonl_payload.encode('utf-8'))
        bytes_io.name = internal_group_batch_id

        # Use the file-like object with the OpenAI File API if needed.
        file_response = openai_client.files.create(
            file=bytes_io,
            purpose='batch'
        )
        logger.info(f"batch_dispatcher: OpenAI file upload response: {file_response}")
        input_file_id = file_response.id
        input_filename = file_response.filename
        input_file_bytes = file_response.bytes


    except Exception as e:
        logger.error(f"batch_dispatcher: Failed to upload file to OpenAI: {e}")
        return





    # Create batch job using file
    try: 
        batch_response = openai_client.batches.create(
            input_file_id=input_file_id,
            endpoint="/v1/chat/completions",
            completion_window="24h"
        )
        logger.info(f"batch_dispatcher: OpenAI batch job response: {batch_response}")
        openai_batch_id = batch_response.id

    except Exception as e:
        logger.error(f"batch_dispatcher: Failed to create batch job: {e}")
        return

    
    
    
    # Store batch info in DynamoDB
    try:
        batches_table.update_item(
            Key={
                'internal_group_batch_id': batch['internal_group_batch_id'],
                'created_at': batch['created_at']
                },
            UpdateExpression='SET input_file_id = :fid, input_filename = :fname, input_file_bytes = :fbytes, ' 
                           'openai_batch_id = :bid, #status = :st, total_jobs = :tj',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':fid': input_file_id,
                ':fname': input_filename,
                ':fbytes': input_file_bytes,
                ':bid': openai_batch_id,
                ':st': 'processing',
                ':tj': len(jobs)
            }
        )
        logger.info(f"batch_dispatcher: Updated batch info in DynamoDB")

    except Exception as e:
        logger.error(f"batch_dispatcher: Failed to update batch info in DynamoDB: {e}")
        return
        

    logger.info(f"batch_dispatcher: Success. Batch job created for {internal_group_batch_id}")


def handle_retry_batch(batch, batches_table, openai_client):
    logging.info(f"Retry batch {batch}")

    if not batch['input_file_id']:
        logger.error(f"batch_dispatcher: Rety batch had no input file id. Exiting..")
        return 
     # Create batch job using file
    try: 
        batch_response = openai_client.batches.create(
            input_file_id=batch['input_file_id'],
            endpoint="/v1/chat/completions",
            completion_window="24h"
        )
        logger.info(f"batch_dispatcher: OpenAI batch job response: {batch_response}")
        openai_batch_id = batch_response.id

    except Exception as e:
        logger.error(f"batch_dispatcher: Failed to create batch job: {e}")
        return

    
    
    # Store batch info in DynamoDB
    try:
        batches_table.update_item(
            Key={
                'internal_group_batch_id': batch['internal_group_batch_id'],
                'created_at': batch['created_at']
                },
            UpdateExpression='SET openai_batch_id = :bid, #status = :st',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':bid': openai_batch_id,
                ':st': 'processing',
            }
        )
        logger.info(f"batch_dispatcher: Updated batch info in DynamoDB")

    except Exception as e:
        logger.error(f"batch_dispatcher: Failed to update batch info in DynamoDB: {e}")
        return
        

    logger.info(f"batch_dispatcher: Success. Retry Batch job created for {batch['internal_group_batch_id']}")

    
