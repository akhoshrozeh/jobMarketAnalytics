import json
from jobspy import scrape_jobs
import pandas as pd

def handler(event, context):
    try:
        jobs = scrape_jobs(
            site_name=["indeed"],
            search_term="software engineer",
            location="San Francisco, CA",
            results_wanted=20,
            hours_old=72,
            country_indeed='USA'
        )
        print(jobs)
        # Convert DataFrame to dict for JSON serialization
        jobs_dict = jobs.to_dict('records')
        
        
        return {
            'statusCode': 200,
            'body': json.dumps(jobs_dict)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
