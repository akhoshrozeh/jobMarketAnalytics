import json
import boto3
import os

def handler(event, context):
    s3 = boto3.client('s3')
    
    try:
        for record in event['Records']:
            detail = json.loads(record['body'])
            # Assuming the data is in the 'detail' field
            data = detail['data']
            
            # Write data to S3
            s3.put_object(
                Bucket=os.environ['BUCKET_NAME'],
                Key=f"data/{record['id']}.json",
                Body=json.dumps(data)
            )
        
        return {
            'statusCode': 200,
            'body': json.dumps('Data written to S3')
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }