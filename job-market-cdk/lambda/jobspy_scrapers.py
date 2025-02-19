import json
import boto3
from jobspy import scrape_jobs
import pandas as pd
import logging
import time
import uuid
import datetime
import os

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
def get_scrape_params():

    titles = [
        'software engineer',
        'front end developer', 
        'backend developer', 
        'full stack developer',
        'devops engineer',
        'security engineer',
        'cloud engineer',
        'UI/UX engineer',
        'web developer',
        'network engineer',
        'mobile developer',
        'mobile engineer',
        'ios developer',
        'android developer',
        'data scientist',
        'data engineer',
        'AI engineer',
        'machine learning engineer',
        'embedded software engineer',
        'cybersecurity analyst',
        'systems engineer',
        'cloud security engineer',
        'database administrator',
        'QA engineer',
        'firmware engineer',
        'systems administrator',
        'IT engineer',
        'MLOps engineer',
        'SOC Analyst',
        'game developer'
        ]
        
    locations = ["San Francisco, CA", "New York, NY", "Los Angeles, CA", "Austin, TX", "Seattle, WA"]
    queries = []
    for location in locations:
        for title in titles:
            queries.append(
                {
                "site_name": ["indeed"],
                "search_term": title,
                "location": location,
                "results_wanted": 100,
                "hours_old": 72,
                "country_indeed": "USA"
                 }
            )

    return queries
    
def handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    lambda_client = boto3.client('lambda')
    jobs_table = dynamodb.Table(os.environ['JOBS_TABLE'])

    scrape_params = get_scrape_params()
    total_jobs = 0
    err_count = 0
    # Jobs with no duplicates.
    final_jobs = []
    seen_job_ids = set()

    

    # Scrape jobs and check for duplicates
    for params in scrape_params:
        try:
            jobs = scrape_jobs(
                site_name=params['site_name'],
                search_term=params['search_term'],
                location=params['location'],
                results_wanted=params['results_wanted'],
                hours_old=params['hours_old'],
                country_indeed=params['country_indeed']
            )

            # Convert DataFrame to dict for JSON serialization
            jobs_dict = jobs.to_dict('records')
            
            # Convert datetime objects to ISO format strings
            for job in jobs_dict:
                for key, value in job.items():
                    if pd.isna(value):  # Handle NaN values
                        job[key] = None
                    elif isinstance(value, pd.Timestamp) or hasattr(value, 'isoformat'):
                        job[key] = value.isoformat()
          

            logger.info(f"Collected {len(jobs_dict)} jobs. Params: {params['site_name']} {params['search_term']} {params['location']} {params['results_wanted']}")
            total_jobs += len(jobs_dict)

            # Dedup
            for job in jobs_dict:
                response = jobs_table.get_item(Key={'site': job['site'], 'id': job['id']})
                job_key = (job['site'], job['id'])
                if 'Item' not in response and job_key not in seen_job_ids:
                    seen_job_ids.add(job_key)
                    final_jobs.append(job)
                

        except Exception as e:
            logger.error(f"ERROR: scraping jobs with params: {params} \n ERROR: {e}")
            continue

    logger.info(f"{len(final_jobs)} jobs ready for processing.")




    

    # Create batches of size 500. OpenAI has batch limit of 2mil enqueued tokens for gpt-4o-mini
    # Write final_jobs to DynamoDB, attaching an internal batch group id
    # Create the Batch Item in Batches Table.
    try:
        logger.info(f"Splitting {len(final_jobs)} jobs into batches in DynamoDB.")
    
        BATCH_SIZE = 300    
        batches_table = dynamodb.Table(os.environ['BATCHES_TABLE'])

        # Initialize 
        now = datetime.datetime.utcnow().isoformat()
        unique_id = str(uuid.uuid4())
        internal_group_batch_id = f"internal_group_batch_id_{unique_id}"
        batch_ids = [internal_group_batch_id]
        
        # init: jobs are stored waiting to upload to openai (handled by batch_dispatcher)
        # processing: the batch has been uploaded to openai and is currently being processed (handled by batch_poller)
        # completed: the batch has been downloaded from openai, and stored both in dynamo and mongo (done; can be deleted after a certain amount of time?)
        # retry: the batch upload to openai failed. needs to be attempted again (handled by batch_dispatcher)
        # failure: something went wrong; manual debugging (handled by ??? - create error handling lambda? - write errors to the table)
        try:
            batches_table.put_item(
                Item={
                    'internal_group_batch_id': internal_group_batch_id,
                    'created_at': now,
                    'status': 'init',
                }
            )
            logger.info(f"jobspy_scraper: stored batch {internal_group_batch_id} in DynamoDB")
        except Exception as e:
            logger.error(f"jobspy_scraper: Failed to store batch info in DynamoDB: {e}")
            return
        
        with jobs_table.batch_writer() as writer:
            for idx, job in enumerate(final_jobs):

                # Write the current batch id item to dynamo; Create new batch id
                if idx > 0 and idx % BATCH_SIZE == 0:
    
                    # create new batch
                    unique_id = str(uuid.uuid4())
                    internal_group_batch_id = f"internal_group_batch_id_{unique_id}"
                    batch_ids.append(internal_group_batch_id)

                to_write = {}
                for field in job:
                    if field in job and job[field] is not None:
                        if isinstance(job[field], float):
                            job[field] = str(job[field])
                        to_write[field] = job[field]
                to_write['internal_group_batch_id'] = internal_group_batch_id
                to_write['created_at'] = now

                # Skip if no fields to write
                if not to_write:
                    logger.warning(f"Skipping job - no valid fields to write: {job}")
                    continue
                    
                writer.put_item(Item=to_write)

    except Exception as err:
        logger.error(
            f"Couldn't load data into jobs table. {err}",
        )
        return {
            'statusCode': 500,
            'body': f"Error writing to DynamoDB: {err}"
        }


    # Create the Batch Items in Batches Table.
    try:
        for internal_group_batch_id in batch_ids:
            batches_table.put_item(
                Item={
                    'internal_group_batch_id': internal_group_batch_id,
                    'created_at': now,
                    'status': 'init',
                }
            )
            logger.info(f"jobspy_scraper: stored batch {internal_group_batch_id} in DynamoDB")
    except Exception as e:
        logger.error(f"jobspy_scraper: Failed to store batch info in DynamoDB: {e}")
        return


    # Invoke the batch dispatcher, passing the interal group batch id
    try:
        # wait for writes to sync
        time.sleep(10)
        logger.info(f"Waited 10s... Invoking batch dispatcher for batches: {batch_ids}")
            # Using asynchronous invocation ("Event") so the call is fire-and-forget.
        response = lambda_client.invoke(
            FunctionName=os.environ["BATCH_DISPATCHER_LAMBDA"],
            InvocationType="Event",  

        )
        logger.info(f"Batch dispatcher invoked. Response: {response}")
    except Exception as err:
        logger.error(f"Error invoking batch dispatcher lambda: {err}")
    


    return {
            'statusCode': 200,
            'body': f"{len(final_jobs)} jobs written."
        }



    
