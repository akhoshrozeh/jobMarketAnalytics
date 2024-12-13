import json
import boto3
import os
import logging  # Add logging

# Add logger configuration at the top
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def call_llama(br, model, prompt):
    return br.invoke_model(
            modelId=model,
            body=json.dumps({
                "prompt": prompt,
                "temperature": 0.5,  # Reduce randomness
                "max_gen_len": 50,  # Limit the response length
                "top_p": 0.5         # Constrain probability mass to the most likely tokens
                
            }), 
            accept="application/json",
            contentType="application/json"
        )


def call_claude(br, model, prompt):
    native_request = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 512,
        "temperature": 0.5,
        "messages": [
            {
                "role": "user",
                "content": [{"type": "text", "text": prompt}],
            }
        ]
    }

    # Convert the native request to JSON.
    request = json.dumps(native_request)

    # Invoke the model with the request.
    return br.invoke_model(modelId=model, 
        body=request,
        accept="application/json",
        contentType="application/json"
    )

# Pull the keywords from Claude's response
# Returns a string of keywords separated by commas
def extract_claude(res):
    content = res.get('content')
    if content is None:
        return 'NO_CONTENT'
    text = content[0].get('text')
    return text

def extract_llama(res):
    text = res.get('generation')
    if text is None:
        return ''
    return text

def keywords_from_str(kw_str):
    kw_str = kw_str.replace('`','')
    # kw_str = kw_str.lower()
    return [word.strip() for word in kw_str.split(',') if word.strip()]



def handler(event, context):
    bedrock = boto3.client(service_name='bedrock-runtime')
    eventbridge = boto3.client('events')


    try:

        record = event['detail']  
        job_record = record['job']
        job_description = record.get('job', {}).get('description', 'no_description')

        

        # Prepare prompt for Bedrock
        prompt = f"""Extract specific technical skills and tools mentioned in the following job description.

        - Output only a list of technical skills or tools explicitly mentioned, such as programming languages, frameworks, libraries, software tools, and platforms.
        - Do not include benefits, compensation details, years of experience, or general phrases unrelated to specific technologies or tools.
        - Only output the keywords as a single string separated by commas. Do not include context, explanations, intros, or outros.

        Job Description:
        {job_description}

        Remember: Your output should be a single string of comma-separated technical skills and tools. Nothing else.

        """


        haiku_3_5_modelId = "us.anthropic.claude-3-5-haiku-20241022-v1:0"
        llama_70b_modelId = "us.meta.llama3-2-90b-instruct-v1:0"
        
        res_claude = call_claude(bedrock, haiku_3_5_modelId, prompt)
        res_claude_body = json.loads(res_claude['body'].read())
        claude_keywords = keywords_from_str(extract_claude(res_claude_body))

        # res_llama = call_llama(bedrock, llama_70b_modelId, prompt)        
        # res_llama_body = json.loads(res_llama['body'].read())
        # llama_keywords = keywords_from_str(extract_llama(res_llama_body))

        # keywords = list(set(claude_keywords).union(set(llama_keywords)))
        # print("claude", claude_keywords)
        # print("llama", llama_keywords)



        # Add extracted keywords back to event
        job_record['extracted_keywords'] = claude_keywords

        
        # Send processed data to EventBridge
        response =eventbridge.put_events(
            Entries=[
                {
                    'Source': 'bedrock.processor',
                    'DetailType': 'BedrockProcessedEvent',
                    'Detail': json.dumps({'processed_data': job_record}),
                    'EventBusName': os.environ['EVENT_BUS_NAME']
                }
            ]
        )

        logger.info(f"EventBridge put_events response: {json.dumps(response)}")

        
        return {
            'statusCode': 200,
            'body': json.dumps('Data processed and sent to EventBridge')
        }
    except Exception as e:
        logger.error(f"Error processing event: {str(e)}", exc_info=True)  # Add full exception info

        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }