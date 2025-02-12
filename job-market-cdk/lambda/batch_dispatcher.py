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

    system_prompt = f"""Extract specific technical skills and tools mentioned in the following job description.

        - Output only a list of technical skills or tools explicitly mentioned, such as programming languages, frameworks, libraries, software tools, protocols, platforms, etc.
        - Do not include benefits, compensation details, years of experience, or general phrases unrelated to specific technologies or tools.
        - Only output the keywords as a single string separated by commas. Do not include context, explanations, intros, or outros.
        - If the job description is not clear or you cannot extract any keywords, output an empty string.
        Remember: Your output should be a single string of comma-separated technical skills and tools, or an empty string if you cannot extract any keywords. Nothing else.
    """

    logger.info(f"batch_processor: received event: {event}")


    # read the data from DDB using internal_batch_group_id_xxx.. as the key
    # format the data as a jsonl file
    # upload to openai as a file
    # save file id of upload
    # make batch api call, using file id from openai 
    # save the batch id (from openai)
    # store [internal batch group id, open batch id, file id] in the batches table

    if event['internal_group_batch_id'] is None or event['internal_group_batch_id'] == "":
        logger.error(f"batch_dispatcher: internal_group_batch_id required in as params in 'event' ")
        return 

    # Get internal_group_batch_id from event
    internal_group_batch_id = event['internal_group_batch_id']

    try:
        # Query jobs from DynamoDB using GSI
        response = jobs_table.query(
            IndexName='InternalGroupBatchIndex',
            KeyConditionExpression='internal_group_batch_id = :id',
            ExpressionAttributeValues={':id': internal_group_batch_id}
        )
        jobs = response.get('Items', [])

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
        now = datetime.utcnow().isoformat()
        batches_table.put_item(
            Item={
                'internal_group_batch_id': internal_group_batch_id,
                'input_file_id': input_file_id,
                'input_filename': input_filename,
                'input_file_bytes': input_file_bytes,
                'openai_batch_id': openai_batch_id,
                'created_at': now,
                'status': 'pending',
                'total_jobs': len(jobs)
            }
        )
        logger.info(f"batch_dispatcher: stored batch info in DynamoDB")
    except Exception as e:
        logger.error(f"batch_dispatcher: Failed to store batch info in DynamoDB: {e}")
        return
        

    logger.info(f"batch_dispatcher: Success. Batch job created for {internal_group_batch_id}")







   


    
