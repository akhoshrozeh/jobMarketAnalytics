import json
import boto3
from jobspy import scrape_jobs
import pandas as pd

def handler(event, context):
    eventbridge = boto3.client('events')
    
    try:
        jobs = scrape_jobs(
            site_name=["indeed"],
            search_term="software engineer",
            location="San Francisco, CA",
            results_wanted=100,
            hours_old=72,
            country_indeed='USA'
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
            'body': json.dumps(jobs_dict, default=str)  # Ensure only one JSON dump
        }

        return response

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
