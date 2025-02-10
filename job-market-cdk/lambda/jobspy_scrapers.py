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
    dedup_table = dynamodb.Table(os.environ['DEDUP_TABLE'])
    s3 = boto3.client('s3')

    scrape_params = get_scrape_params()
    total_jobs = 0
    err_count = 0
    # Jobs with no duplicates.
    final_jobs = []
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
            logger.info(f"Deduping {len(jobs_dict)} jobs...")
            total_jobs += len(jobs_dict)

            # Dedup
            for job in jobs_dict:
                response = dedup_table.get_item(Key={'site': job['site'], 'id': job['id']})
                if 'Item' not in response:
                    logger.info(f"New job found: {job['id']}")
                    final_jobs.append(job)
                

            logger.info(f"{len(final_jobs)} jobs after deduping.")

                    

        except Exception as e:
            logger.error(f"ERROR: scraping jobs with params: {params} \n ERROR: {e}")
            err_count += 1
            continue

    # Write to DynamoDB
    try:
        logger.info(f"Writing {len(final_jobs)} jobs to DynamoDB...")
        with dedup_table.batch_writer() as writer:
            for job in final_jobs:
                to_write = {}
                for field in ['id', 'site', 'title', 'company', 'job_url', 'job_url_direct']:
                    if field in job and job[field] is not None:
                        to_write[field] = job[field]
                
                # Skip if no fields to write
                if not to_write:
                    logger.warning(f"Skipping job - no valid fields to write: {job}")
                    continue
                    
                writer.put_item(Item=to_write)
    except Exception as err:
        logger.error(
            "Couldn't load data into table %s. Here's why: %s: %s",
            dedup_table.name,
            err.response["Error"]["Code"],
            err.response["Error"]["Message"],
        )
        return {
            'statusCode': 500,
            'body': f"Error writing to DynamoDB: {err}"
        }

    # Write to S3
    if len(final_jobs) > 0:
        now = datetime.datetime.utcnow()
        # Append a short UUID to ensure the key is unique, even if multiple files
        # are created within the same second.
        unique_id = str(uuid.uuid4())
        s3_key = f"{now.strftime('%Y/%m/%d')}/{now.strftime('%H%M%S')}_{unique_id}_new_jobs.json"
        bucket_name = os.environ['RAW_JOB_SCRAPES_BUCKET']
        
        s3.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=json.dumps(final_jobs),
            ContentType="application/json"  # Ensures S3 understands the file type
        )
        logger.info(f"New jobs file written to S3: s3://{bucket_name}/{s3_key}")

    if err_count > 0:
       return {
            'statusCode': 500,
            'body': f"{err_count} errors found."
        }

    else:
        return {
            'statusCode': 200,
            'body': f"{len(final_jobs)} jobs found."
        }



    
