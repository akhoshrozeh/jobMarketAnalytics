import json
import boto3

def handler(event, context):
    bedrock = boto3.client('bedrock-runtime')
    eventbridge = boto3.client('events')
    
    try:
        for record in event['Records']:
            detail = json.loads(record['body'])
            jobs = detail['jobs']
            
            for job in jobs:
                # Prepare prompt for Bedrock
                prompt = f"""I'm going to give you a job description for a job opening in the tech field. I want you to extract all the keywords that highlight what the employer is looking for. Things such as CI/CD, React, Go, Microservices, Communcation, Agile, etc. I want your output to be in the format of a python array of strings. Here's the job:
                {job['description']}
                """
                
                # Call Bedrock (using Claude model as an example)
                response = bedrock.invoke_model(
                    modelId="meta.llama3-2-90b-instruct-v1:0",
                    body=json.dumps({
                        "prompt": prompt,
                        "max_tokens_to_sample": 2000,
                        "temperature": 0.5
                    })
                )
                
                # Process the response
                bedrock_response = json.loads(response['body'].read())
                
                # Send processed data to EventBridge
                eventbridge.put_events(
                    Entries=[
                        {
                            'Source': 'bedrock.processor',
                            'DetailType': 'BedrockProcessedEvent',
                            'Detail': json.dumps({'processed_data': bedrock_response}),
                            'EventBusName': os.environ['EVENT_BUS_NAME']
                        }
                    ]
                )
        
        return {
            'statusCode': 200,
            'body': json.dumps('Data processed and sent to EventBridge')
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }