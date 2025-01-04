import json
import boto3
from jobspy import scrape_jobs
import pandas as pd
import logging
import time

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

def handler(event, context):
    eventbridge = boto3.client('events')
    
    required_params = ['site_name', 'search_term', 'location', 'results_wanted', 'hours_old', 'country_indeed']
    missing_params = [param for param in required_params if param not in event]
    if len(missing_params) > 0:
        return {
            'statusCode': 400,
            'body': f"Missing required parameters: {', '.join(missing_params)}"
        }

    try:
        jobs = scrape_jobs(
            site_name=[event['site_name']],
            search_term=event['search_term'],
            location=event['location'],
            results_wanted=event['results_wanted'],
            hours_old=event['hours_old'],
            country_indeed=event['country_indeed']
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

        response = {
            'statusCode': 200,
            'body': f"{len(jobs_dict)} jobs found."
        }

        return response

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
