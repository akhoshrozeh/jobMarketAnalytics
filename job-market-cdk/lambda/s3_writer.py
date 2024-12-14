import json
import boto3
import os

def handler(event, context):
    s3 = boto3.client('s3')
    event_bus = boto3.client('events')

    
    try:
        # Assume event itself is a dictionary
        if 'detail' in event:  # Check if "detail" exists in the event
            record = event['detail']  # Extract the details field
            job_record = record['job']
            
            # Debugging: Print the record
            jsonified = json.dumps(job_record, indent=4)
            # print("pretty", jsonified["job"])
            
            # Extract the job ID for S3 key
            job_id = record.get('job', {}).get('id', 'unknown_id')
            site = record.get('job', {}).get('site', 'unknown_site')
            
            # Write record to S3
            res = s3.put_object(
                Bucket=os.environ['BUCKET_NAME'],
                Key=f"data/{site}/{job_id}.json",
                Body=jsonified  # Convert to JSON string
            )

            print("S3 Response:", res)

            # make sure
            if res.get('ResponseMetadata', {}).get('HTTPStatusCode') == 200:
                event_bus.put_events(
                    Entries=[
                        {
                            'Source': 's3.writer',
                            'DetailType': 'S3WriteCompleteEvent',
                            'Detail': jsonified
                        }
                    ]
                )

            return {
                'statusCode': 200,
                'body': json.dumps('Data written to S3')
            }
        else:
            # Handle case where "detail" is missing
            return {
                'statusCode': 400,
                'body': json.dumps('Missing "detail" in event payload')
            }
    except Exception as e:
        # Catch and log errors
        print("Error:", str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
