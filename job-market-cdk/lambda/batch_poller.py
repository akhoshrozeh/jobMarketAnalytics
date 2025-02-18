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


# reads the batches table from Dynamo, where status = processing
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
        # Get processing batches from DynamoDB
        batches_table = dynamodb.Table(os.environ['BATCHES_TABLE'])

        response = batches_table.query(
            IndexName="StatusIndex",
            KeyConditionExpression='#status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': 'processing'}
        )
        processing_batches = response.get('Items', [])
        
        if not processing_batches:
            logger.info("batch_poller: No processing batches found")
            return

        logger.info(f"batch_poller: {len(processing_batches)} processing batches: {processing_batches}")

        # Process processing batches
        for batch in processing_batches:
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

        logger.info(f"batch_poller: OpenAI batch: {openai_batch}")

        match openai_batch.status:
            case 'validating' | 'in_progress' | 'finalizing' | 'cancelling' | 'cancelled':
                logger.info(f"batch_poller: Batch {batch_id} not complete. Current status: {openai_batch.status}")
                return

            case 'failed':
                if openai_batch.errors.data[0].code == 'token_limit_exceeded':
                    logger.info(f"batch_poller: batch creation caused token_limit_exceeded error. Updating batch status to 'retry'")
                    handle_token_limit_error(batch, batches_table)
                else:
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



        logger.info(f"{len(results)} jobs in the batch from openai")
        
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
                last_evaluated_key = None
                
                while True:
                    query_args = {
                        'IndexName':'InternalGroupBatchIndex',
                        'KeyConditionExpression':'internal_group_batch_id = :id',
                        'ProjectionExpression':'site, id, company, company_addresses, company_revenue, created_at, date_posted, is_remote, #loc, job_url, job_url_direct, max_amount, min_amount, title, extracted_keywords, internal_group_batch_id',
                        'ExpressionAttributeNames':{
                            '#loc': 'location'
                        },
                        'ExpressionAttributeValues':{':id': batch['internal_group_batch_id']},
                    }

                    if last_evaluated_key:
                        query_args['ExclusiveStartKey'] = last_evaluated_key

                    response = jobs_table.query(**query_args)
                    jobs.extend(response.get('Items', []))
                    last_evaluated_key = response.get('LastEvaluatedKey')  

                    if not last_evaluated_key:
                        break

                logger.info(f"{len(jobs)} jobs pulled from dynamodb.")
                
        
                # Verify all jobs have keywords
                missing_keywords = [j['id'] for j in jobs if 'extracted_keywords' not in j]
                
                # none missing
                if len(missing_keywords) == 0 and len(jobs) == len(results):
                    break
                    
                logger.warning(f"Attempt {attempt+1}: {len(missing_keywords)} jobs missing keywords")
                
                
                # Exponential backoff with jitter
                sleep_time = base_delay * (2 ** attempt) + random.uniform(0, 0.1)
                time.sleep(sleep_time)
                
            except Exception as e:
                logger.error(f"Query attempt {attempt+1} failed: {e}")
                if attempt == max_retries - 1:
                    raise

        if not jobs or len(results) != len(jobs):
            logger.error("Failed to retrieve jobs with keywords after retries")
            return
        elif len(missing_keywords) > 0:
            logger.error(f"Permanent missing keywords in jobs: {missing_keywords[:3]}...")
            return
            





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
        )
        raise


# Sets the status to 'retry', which is then handled by 'batch_dispatcher' lambda
def handle_token_limit_error(batch, batches_table):
    try:
        batches_table.update_item(
            Key={
                'internal_group_batch_id': batch['internal_group_batch_id'],
                'created_at': batch['created_at']
                },
            UpdateExpression='SET #status = :val',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':val': 'retry'}
        )
        logger.info(f"batch_poller: Updated batch {batch['internal_group_batch_id']} to 'retry' in DynamoDB")

    except Exception as e:
        logger.error(f"batch_poller: Failed to set batch status to 'retry' in DynamoDB: {e}")
        return
