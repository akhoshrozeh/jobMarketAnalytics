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
    return [
        {
                "site_name": ["indeed"],
                "search_term": "software engineer",
                "location": "San Francisco, CA",
                "results_wanted": 10,
                "hours_old": 72,
                "country_indeed": "USA"
        },
        # {
        #         "site_name": ["indeed"],
        #         "search_term": "software engineer",
        #         "location": "Los Angeles, CA",
        #         "results_wanted": 100,
        #         "hours_old": 72,
        #         "country_indeed": "USA"
        # },
        # {
        #         "site_name": ["indeed"],
        #         "search_term": "software engineer",
        #         "location": "New York City, NY",
        #         "results_wanted": 100,
        #         "hours_old": 72,
        #         "country_indeed": "USA"
        # },
        # {
        #         "site_name": ["indeed"],
        #         "search_term": "software engineer",
        #         "location": "Seattle, WA",
        #         "results_wanted": 100,
        #         "hours_old": 72,
        #         "country_indeed": "USA"
        # },
        # {
        #         "site_name": ["indeed"],
        #         "search_term": "software engineer",
        #         "location": "Boston, MA",
        #         "results_wanted": 100,
        #         "hours_old": 72,
        #         "country_indeed": "USA"
        # },
        # {
        #         "site_name": ["indeed"],
        #         "search_term": "software engineer",
        #         "location": "San Diego, CA",
        #         "results_wanted": 100,
        #         "hours_old": 72,
        #         "country_indeed": "USA"

        # },
        # {
        #         "site_name": ["indeed"],
        #         "search_term": "software engineer",
        #         "location": "Chicago, IL",
        #         "results_wanted": 100,
        #         "hours_old": 72,
        #         "country_indeed": "USA"
        # }
    ]
    
def handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    lambda_client = boto3.client('lambda')
    jobs_table = dynamodb.Table(os.environ['JOBS_TABLE'])
    s3 = boto3.client('s3')

    scrape_params = get_scrape_params()
    total_jobs = 0
    err_count = 0
    # Jobs with no duplicates.
    final_jobs = []

    now = datetime.datetime.utcnow()
    unique_id = str(uuid.uuid4())
    internal_group_batch_id = f"internal_group_batch_id_{unique_id}"

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
                if 'Item' not in response:
                    final_jobs.append(job)
                

        except Exception as e:
            logger.error(f"ERROR: scraping jobs with params: {params} \n ERROR: {e}")
            err_count += 1
            continue

    logger.info(f"{len(final_jobs)} jobs for {internal_group_batch_id}")

    # Write final_jobs to DynamoDB, attaching an internal batch group id
    try:
        logger.info(f"Writing {len(final_jobs)} jobs to DynamoDB...")
        
        with jobs_table.batch_writer() as writer:
            for job in final_jobs:
                to_write = {}
                for field in job:
                    if field in job and job[field] is not None:
                        if isinstance(job[field], float):
                            job[field] = str(job[field])
                        to_write[field] = job[field]
                to_write['internal_group_batch_id'] = internal_group_batch_id
                to_write['created_at'] = now.isoformat()

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


    # Invoke the batch dispatcher, passing the interal group batch id
    try:
        payload = {
            "internal_group_batch_id": internal_group_batch_id,
        }
        # Using asynchronous invocation ("Event") so the call is fire-and-forget.
        response = lambda_client.invoke(
            FunctionName=os.environ["BATCH_DISPATCHER_LAMBDA"],
            InvocationType="Event",  
            Payload=json.dumps(payload)
        )
        logger.info(f"Batch dispatcher invoked. Response: {response}")
    except Exception as err:
        logger.error(f"Error invoking batch dispatcher lambda: {err}")
        # Optionally, you can updat
    

    if err_count > 0:
       return {
            'statusCode': 500,
            'body': f"{err_count} errors found."
        }

    else:
        return {
            'statusCode': 200,
            'body': f"{len(final_jobs)} jobs written."
        }



    
