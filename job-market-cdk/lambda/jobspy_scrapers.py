import json
import boto3
from jobspy import scrape_jobs
import pandas as pd
import logging
import time

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

def get_scrape_params():
    return [
        {
                "site_name": ["indeed"],
                "search_term": "software engineer",
                "location": "San Francisco, CA",
                "results_wanted": 100,
                "hours_old": 72,
                "country_indeed": "USA"
        },
        {
                "site_name": ["indeed"],
                "search_term": "software engineer",
                "location": "Los Angeles, CA",
                "results_wanted": 100,
                "hours_old": 72,
                "country_indeed": "USA"
        },
        {
                "site_name": ["indeed"],
                "search_term": "software engineer",
                "location": "New York City, NY",
                "results_wanted": 100,
                "hours_old": 72,
                "country_indeed": "USA"
        },
        {
                "site_name": ["indeed"],
                "search_term": "software engineer",
                "location": "Seattle, WA",
                "results_wanted": 100,
                "hours_old": 72,
                "country_indeed": "USA"
        },
        {
                "site_name": ["indeed"],
                "search_term": "software engineer",
                "location": "Boston, MA",
                "results_wanted": 100,
                "hours_old": 72,
                "country_indeed": "USA"
        },
        {
                "site_name": ["indeed"],
                "search_term": "software engineer",
                "location": "San Diego, CA",
                "results_wanted": 100,
                "hours_old": 72,
                "country_indeed": "USA"

        },
        {
                "site_name": ["indeed"],
                "search_term": "software engineer",
                "location": "Chicago, IL",
                "results_wanted": 100,
                "hours_old": 72,
                "country_indeed": "USA"
        }
    ]
    
def handler(event, context):
    eventbridge = boto3.client('events')

    scrape_params = get_scrape_params()
    total_jobs = 0
    err_count = 0
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
                        
            # Send each job to EventBridge
            # Claude Haiku 3.5 can handle 2000 req/min or 33 req/sec
            # We want to limit the number of requests to 25 per second
            logger.info(f"Sending {len(jobs_dict)} jobs to EventBridge")
            for job in jobs_dict:
                eventbridge.put_events(
                    Entries=[
                        {
                            'Source': 'job.scraper',
                            'DetailType': 'JobScrapeEvent',
                            'Detail': json.dumps({'job': job}),
                            'EventBusName': 'JobScrapeEventBus'
                        }
                    ]
                )
            total_jobs += len(jobs_dict)

        except Exception as e:
            logger.error(f"ERROR: scraping jobs with params: {params} \n ERROR: {e}")
            err_count += 1
            continue



    if err_count > 0:
       return {
            'statusCode': 500,
            'body': f"{err_count} errors found."
        }

    else:
        return {
            'statusCode': 200,
            'body': f"{total_jobs} jobs found."
        }



    
