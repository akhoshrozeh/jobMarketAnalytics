import boto3
import logging
from openai import OpenAI
import os
import json

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
mongodb = boto3.client('s3')  # Update with actual MongoDB client config
openai_client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])


# reads the batches table from Dynamo, where status = pending
    # saves those open_ai_batch_ids

    # api call to openai, checking the status
        # if not complete:
            # do nothing
        # if complete:
            # load the file data and format for writing:
            # save the extracted keywrods from the output file
            # extract job specific info using id from the lines in the output file, from jobs table
            # write the extracted keywoprds to mongodb, along with other data (batch ids, title, etc)
            # write output file id and update batch status in Batches table
# gets triggered periodically (every hr)
def handler(event, context):
    try:
        # Get pending batches from DynamoDB
        batches_table = dynamodb.Table(os.environ['BATCHES_TABLE'])

        response = batches_table.query(
            IndexName="StatusIndex",
            KeyConditionExpression:'status = :status',
            ExpressionAttributeValues={':status': 'pending'}
        )
        pending_batches = response.get('Items', [])
        
        if not pending_batches:
            logger.info("batch_poller: No pending batches found")
            return

        logger.info(f"batch_poller: Found {len(pending_batches)} pending batches")

        for batch in pending_batches:
            process_batch(batch, batches_table)

    except Exception as e:
        logger.error(f"batch_poller: Critical error in handler: {e}")
        raise

def process_batch(batch, batches_table):
    try:
        batch_id = batch['openai_batch_id']
        logger.info(f"batch_poller: Processing batch {batch_id}")
        
        # Check OpenAI batch status
        openai_batch = openai_client.batches.retrieve(batch_id)

        logger.info(f"batch_poller: OpenAI batch status: {openai_batch.status}")
        
        if openai_batch.status != 'completed':
            logger.info(f"batch_poller: Batch {batch_id} not complete. Current status: {openai_batch.status}")
            return

        # Download and process results
        output_file = openai_client.files.content(openai_batch.output_file_id)
        results = [json.loads(line) for line in output_file.text.splitlines()]

        logger.info(f"batch_poller: results: {results}")
        
        # Process each result
        jobs_table = dynamodb.Table(os.environ['JOBS_TABLE'])
        keywords_data = []
        
        for result in results:
            if result['response']['status_code'] == 200:
                process_successful_result(result, jobs_table, keywords_data)
        
        # Store keywords in MongoDB
        if keywords_data:
            store_in_mongodb(batch, keywords_data)
        
        # Update batch status
        batches_table.update_item(
            Key={'openai_batch_id': batch_id},
            UpdateExpression='SET #status = :complete, output_file_id = :file_id',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':complete': 'complete',
                ':file_id': openai_batch.output_file_id
            },
            ConditionExpression='#status = :pending',
        )
        logger.info(f"batch_poller: Successfully updated batch {batch_id}")

    except Exception as e:
        logger.error(f"batch_poller: Error processing batch {batch.get('openai_batch_id')}: {e}")
        batches_table.update_item(
            Key={'openai_batch_id': batch_id},
            UpdateExpression='SET #status = :failed',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':failed': 'failed'}
        )
        raise

def process_successful_result(result, jobs_table, keywords_data):
    custom_id = result['custom_id']
    response_body = json.loads(result['response']['body'])
    keywords = response_body['choices'][0]['message']['content'].strip()
    
    if not keywords:
        return

    # Update job in DynamoDB
    jobs_table.update_item(
        Key={'id': custom_id},
        UpdateExpression='SET extracted_keywords = :keywords',
        ExpressionAttributeValues={':keywords': keywords}
    )
    
    # Prepare for MongoDB storage
    keywords_data.append({
        'job_id': custom_id,
        'keywords': keywords.split(','),
        'batch_id': result['custom_id']
    })

def store_in_mongodb(batch, keywords_data):
    pass
    # try:
    #     # Replace with actual MongoDB storage logic
    #     mongodb.put_object(
    #         Bucket=os.environ['KEYWORDS_BUCKET'],
    #         Key=f"keywords/{batch['openai_batch_id']}.json",
    #         Body=json.dumps(keywords_data)
    #     )
    #     logger.info(f"batch_poller: Stored {len(keywords_data)} keyword sets in MongoDB")
    # except Exception as e:
    #     logger.error(f"batch_poller: Failed to store keywords in MongoDB: {e}")
    #     raise


   


    
