import boto3
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

    
def handler(event, context):
    s3 = boto3.client('s3')
    logger.info(f"batch_processor: received event: {event}")

    # get bucket name and key
    bucket_name = event['Records'][0]['s3']['bucket']['name']
    bucket_key = event['Records'][0]['s3']['object']['key']

    logger.info(f"batch_processor: bucket_name: {bucket_name}")
    logger.info(f"batch_processor: bucket_key: {bucket_key}")

    # get the file from s3
    response = s3.get_object(Bucket=bucket_name, Key=bucket_key)
    file_content = response['Body'].read().decode('utf-8')

    logger.info(f"batch_processor: file_content: {file_content}")



   


    
