import boto3
import logging
from openai import OpenAI
import os 
import json
import io
from datetime import datetime


logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

    
def handler(event, context):
    s3 = boto3.client('s3')
    dynamodb = boto3.resource('dynamodb')
    batch_table = dynamodb.Table(os.environ['BATCH_TABLE'])
    openai_client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])

    system_prompt = f"""Extract specific technical skills and tools mentioned in the following job description.

        - Output only a list of technical skills or tools explicitly mentioned, such as programming languages, frameworks, libraries, software tools, protocols, platforms, etc.
        - Do not include benefits, compensation details, years of experience, or general phrases unrelated to specific technologies or tools.
        - Only output the keywords as a single string separated by commas. Do not include context, explanations, intros, or outros.
        - If the job description is not clear or you cannot extract any keywords, output an empty string.
        Remember: Your output should be a single string of comma-separated technical skills and tools, or an empty string if you cannot extract any keywords. Nothing else.
    """

    # logger.info(f"batch_processor: received event: {event}")

    # get bucket name and key
    # bucket_name = event['Records'][0]['s3']['bucket']['name']
    # bucket_key = event['Records'][0]['s3']['object']['key']

    bucket_name = "job-trendr-raw-job-scrapes"
    bucket_key =  "2025/02/10/075123_67d3617b-cd38-4d30-b637-047e73af9110_jobs.jsonl"

    # get the file from s3
    response = s3.get_object(Bucket=bucket_name, Key=bucket_key)
    file_content = response['Body'].read().decode('utf-8')

     # If the file is in JSONL format, parse each line separately:
    batch_payload = []
    for line in file_content.splitlines():
        if line.strip():  # Ignore empty lines
            job = json.loads(line)
            payload = {
                "custom_id": job['id'],
                "method": "POST",
                "url": "/v1/chat/completions",
                "body": {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": system_prompt
                        },
                        {
                            "role": "user",
                            "content": job['description']
                        }
                    ]
                }
            }
            batch_payload.append(payload)

    jsonl_payload = "\n".join(json.dumps(payload, separators=(',', ':')) for payload in batch_payload)
    # logger.info(f"batch_processor: batch_payload: {jsonl_payload}")



    # Event gets passed into this lambda
    # using event data, lambda pulls the new data from s3
    # create jsonl, openai format specfic json
    # it uploads the file to openai, and returns a reference id
    # using this ref id, we we create a batch job
    # we write all this data to dynamodb  (batch job id, reference file id, bucket key, etc.) and set the status
    # then exit since it's a batch job. the batch poller will handle 

    bytes_io = io.BytesIO(jsonl_payload.encode('utf-8'))
    bytes_io.name = bucket_key

    
    # Use the file-like object with the OpenAI File API if needed.
    try:
        openai_file_response = openai_client.files.create(
            file=bytes_io,
            purpose="batch"  # or other purpose as needed
        )
        logger.info(f"batch_processor: OpenAI file upload response: {openai_file_response}")
        logger.info(type(openai_file_response))
        logger.info(openai_file_response.id)

    except Exception as e:
        logger.error(f"batch_processor: Error uploading file to OpenAI: {e}")
        raise e



    # try:
    #     dynamodb.put_item(
    #         TableName=os.environ['BATCH_TABLE'],
    #         Item={
    #             'batch_id': bucket_key,
    #             'created_at': datetime.now().isoformat(),
    #             'status': 'processing'
    #         }
    #     )
        
    # except Exception as e:
    #     logger.error(f"batch_processor: error: {e}")
    #     raise e








   


    
