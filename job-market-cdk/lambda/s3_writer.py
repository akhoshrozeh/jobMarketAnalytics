import json
import boto3
import os
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

def handler(event, context):
    s3 = boto3.client('s3')
    sqs = boto3.client('sqs')

    
    try:
        # Assume event itself is a dictionary
        if 'detail' in event:  # Check if "detail" exists in the event
            record = event['detail']  # Extract the details field
            job_record = record['job']
            
            # Debugging: Print the record
            jsonified = json.dumps(job_record, indent=4)

            
            # Extract the job ID for S3 key
            job_id = record.get('job', {}).get('id', 'unknown_id')
            site = record.get('job', {}).get('site', 'unknown_site')
            s3_key = f"data/{site}/{job_id}.json"

            try:
                s3.head_object(Bucket=os.environ['BUCKET_NAME'], Key=s3_key)
                logger.info(f"Object {s3_key} already exists in S3.")
                return {
                    'statusCode': 200,
                    'body': json.dumps(f'Object {s3_key} already exists in S3')
                }
            except Exception as e:
                logger.info(f"Object {s3_key} does not exist in S3. Writing...")
            
                # Write record to S3
                res = s3.put_object(
                    Bucket=os.environ['BUCKET_NAME'],
                    Key=f"data/{site}/{job_id}.json",
                    Body=jsonified  # Convert to JSON string
                )



                # Send to SQS queue for bedrock processor
                if res.get('ResponseMetadata', {}).get('HTTPStatusCode') == 200:
                    logger.info(f"Sending to SQS queue for bedrock processor: {jsonified}")
                    enqueue_res = sqs.send_message(
                        QueueUrl=os.environ['QUEUE_URL'],
                        MessageBody=jsonified
                    )
                    logger.info(f"Enqueued response: {enqueue_res}")


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
        logger.error("Error:", str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
