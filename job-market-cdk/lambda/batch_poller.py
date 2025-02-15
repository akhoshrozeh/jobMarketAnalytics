import boto3
import logging
from openai import OpenAI
import os
import json
import datetime
import time 
import random
import pymongo as pymongo

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
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
            KeyConditionExpression='#status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': 'pending'}
        )
        pending_batches = response.get('Items', [])
        
        if not pending_batches:
            logger.info("batch_poller: No pending batches found")
            return

        logger.info(f"batch_poller: {len(pending_batches)} pending batches: {pending_batches}")

        # Process pending batches
        for batch in pending_batches:
            process_batch(batch, batches_table)

    except Exception as e:
        logger.error(f"batch_poller: Critical error in handler: {e}")
        raise

def process_batch(batch, batches_table):
    try:
        # openAI returns its own batch_id it returns when creating a batch
        batch_id = batch['openai_batch_id']
        logger.info(f"batch_poller: Processing batch {batch_id}") 
        
        # Check OpenAI batch status
        openai_batch = openai_client.batches.retrieve(batch_id)

        logger.info(f"batch_poller: OpenAI batch status: {openai_batch.status}")

        match openai_batch.status:
            case 'validating' | 'in_progress' | 'finalizing' | 'cancelling' | 'cancelled':
                logger.info(f"batch_poller: Batch {batch_id} not complete. Current status: {openai_batch.status}")
                return
            case 'failed':
                logger.error(f"batch_poller: FAILURE - OpenAI failed to process the batch. openai_batch_id {batch_id}")
                return
            case 'expired':
                logger.error(f"batch_poller: EXPIRED - OpenAI was unable to complete the batch job in time. openai_batch_id {batch_id}")
                return 
            case 'completed':
                logger.info(f"batch_poller: Batch job completed. openai_batch_id: {batch_id}")
            case _:
                logger.error(f"batch_poller: ERROR - openai_batch.status couldn't be matched")
                return



        # Download and process results
        output_file = openai_client.files.content(openai_batch.output_file_id)
        results = [json.loads(line) for line in output_file.text.splitlines()]

        # logger.info(f"batch_poller: Batch results: {results}")
        
        # # Process each result
        jobs_table = dynamodb.Table(os.environ['JOBS_TABLE'])

        site_keys = {
            'gd':'glassdoor',
            'go':'google',
            'in':'indeed',
            'li':'linkedin',
            'zr':'ziprecruiter'
        }

        # we need to bundle up results for batch writes to jobs table (ddb) and mongo
        for result in results:
            if result['response']['status_code'] == 200:
                # keys for jobs tables
                jobs_table_job_id = result['custom_id']
                site = site_keys[jobs_table_job_id[:2]]

                extracted_keywords_str = result['response']['body']['choices'][0]['message']['content']
                extracted_keywords = [keyword.strip() for keyword in extracted_keywords_str.split(',')]

                # Update jobs table with extracted keywords
                jobs_table.update_item(
                    Key={
                        'id': jobs_table_job_id,
                        'site': site
                    },
                    UpdateExpression='SET extracted_keywords = :keywords',
                    ExpressionAttributeValues={
                        ':keywords': extracted_keywords
                    }
                )

        max_retries = 3
        base_delay = 0.5  # seconds
        jobs = []
    
        # Can't do consistent reads on GSI. Wait for updates with retrys; need to check extracted_keywords were added to all jobs
        for attempt in range(max_retries):
            # Read in all the jobs for this batch, including newly written extracted keywords
            try:
                response = jobs_table.query(
                    IndexName='InternalGroupBatchIndex',
                    KeyConditionExpression='internal_group_batch_id = :id',
                    ProjectionExpression='site, id, company, company_addresses, company_revenue, created_at, date_posted, is_remote, #loc, job_url, job_url_direct, max_amount, min_amount, title, extracted_keywords, internal_group_batch_id',
                    ExpressionAttributeNames={
                        '#loc': 'location'
                    },
                    ExpressionAttributeValues={':id': batch['internal_group_batch_id']},
                )
                
                current_jobs = response.get('Items', [])
        
                # Verify all jobs have keywords
                missing_keywords = [j['id'] for j in current_jobs if 'extracted_keywords' not in j]
                
                # none missing
                if len(missing_keywords) == 0:
                    jobs = current_jobs
                    break
                    
                logger.warning(f"Attempt {attempt+1}: {len(missing_keywords)} jobs missing keywords")
                
                # Exponential backoff with jitter
                sleep_time = base_delay * (2 ** attempt) + random.uniform(0, 0.1)
                time.sleep(sleep_time)
                
            except Exception as e:
                logger.error(f"Query attempt {attempt+1} failed: {e}")
                if attempt == max_retries - 1:
                    raise

        if not jobs:
            logger.error("Failed to retrieve jobs with keywords after retries")
            return
        elif len(missing_keywords) > 0:
            logger.error(f"Permanent missing keywords in jobs: {missing_keywords[:3]}...")
            

         # Store keywords in MongoDB
        try:
            mongo_client = pymongo.MongoClient(os.environ['MONGODB_URI'])
            db = mongo_client[os.environ['MONGODB_DATABASE']]
            collection = db[os.environ['MONGODB_COLLECTION']]

            operations = []
            for job in jobs:
                if job['extracted_keywords']:
                    job['inserted_at'] = datetime.datetime.utcnow()
                    operations.append(
                        pymongo.UpdateOne(
                            {'id': job['id']},
                            {'$setOnInsert': job},
                            upsert=True
                        )
                    )

            res = collection.bulk_write(operations)
            logger.info(f"batch_poller: bulk_write response:{res}")
            
            if res.bulk_api_result['writeErrors']:
                logger.error(f"batch_poller: writeErrors during bulk_write: {res.bulk_api_result['writeErrors']}")

        except Exception as e:
            logger.error(f"batch_poller: Error when attempting to bulk_write to MongoDB: {e}")
            raise
        
        # Update batch status
        try:
            batches_table.update_item(
                Key={
                    'internal_group_batch_id': batch['internal_group_batch_id'],
                    'created_at': batch['created_at']
                    },
                UpdateExpression='SET #status = :completed  , output_file_id = :file_id',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':completed': 'completed',
                    ':file_id': openai_batch.output_file_id
                },
            )
            logger.info(f"batch_poller: Successfully updated batch {batch_id}")
        except Exception as e:
            logger.error(f"batch_poller: Error updating the batch table to 'complete' ")
            raise

    except Exception as e:
        logger.error(f"batch_poller: Error processing batch {batch.get('openai_batch_id')}: {e}")
        batches_table.update_item(
            Key={
                'internal_group_batch_id': batch['internal_group_batch_id'],
                'created_at': batch['created_at']
                },
            UpdateExpression='SET #status = :error',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':error': 'error'}
        # )
        raise


    
