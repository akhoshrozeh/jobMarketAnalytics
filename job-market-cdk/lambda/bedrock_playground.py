import json
import boto3
import os
import logging  # Add logging
import time
import math

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
    if type(content) is not list:
        logger.info(f"WARNING: content is not list: {content}")
        return 'NOT_LIST'
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

def call_bedrock_with_retries(br, model, prompt, is_claude=True):
    MAX_RETRIES = 4
    retries = 0
    retry = False

    while retries < MAX_RETRIES:
        logger.info(f"RETRY: retrying {retries} of {MAX_RETRIES}")
        try:
            # Calculate wait time with exponential backoff
            wait_ms = int((math.pow(2, retries) - 1) * 100)
            if retries > 0:
                logger.info(f"Waiting {wait_ms}ms before retry {retries}")
                time.sleep(wait_ms / 1000)  # Convert to seconds

            # Make the API call based on model type
            if is_claude:
                response = call_claude(br, model, prompt)
            else:
                response = call_llama(br, model, prompt)
            
            return response

        except Exception as e:
            if 'ThrottlingException' in str(e):
                logger.warning(f"Request throttled (attempt {retries + 1}/{MAX_RETRIES})")
                retry = True
            else:
                logger.error(f"Non-throttling error occurred: {str(e)}")
                raise e

        retries += 1
        if retries == MAX_RETRIES:
            raise Exception(f"Max retries ({MAX_RETRIES}) reached while calling Bedrock")

def handler(event, context):
    bedrock = boto3.client(service_name='bedrock-runtime')
    eventbridge = boto3.client('events')
    logger.info(f"Received event: {event}")


    try:
        record = event['Records'][0]['body']
        logger.info(f"record {record}")
        record = json.loads(record)


        # Prepare prompt for Bedrock
        prompt = f"""Extract specific technical skills and tools mentioned in the following job description.

        - Output only a list of technical skills or tools explicitly mentioned, such as programming languages, frameworks, libraries, software tools, and platforms.
        - Do not include benefits, compensation details, years of experience, or general phrases unrelated to specific technologies or tools.
        - Only output the keywords as a single string separated by commas. Do not include context, explanations, intros, or outros.
        - If the job description is not clear or you cannot extract any keywords, output an empty string.

        Job Description:
        {job_description}

        Remember: Your output should be a single string of comma-separated technical skills and tools, or an empty string if you cannot extract any keywords. Nothing else.

        """


        haiku_3_5_modelId = "us.anthropic.claude-3-5-haiku-20241022-v1:0"
        llama_70b_modelId = "us.meta.llama3-2-90b-instruct-v1:0"
        llama_11b_modelId = "us.meta.llama3-2-11b-instruct-v1:0"

        res = call_bedrock_with_retries(bedrock, llama_11b_modelId, prompt, is_claude=False)
        res_body = json.loads(res['body'].read())
        llama_keywords = keywords_from_str(extract_llama(res_body))

        # Call Claude
        # res_claude = call_bedrock_with_retries(bedrock, haiku_3_5_modelId, prompt, is_claude=True)
        # res_claude_body = json.loads(res_claude['body'].read())
        # claude_keywords = keywords_from_str(extract_claude(res_claude_body))

        # If you're using Llama, uncomment and update these lines
        # res_llama = call_bedrock_with_retries(bedrock, llama_70b_modelId, prompt, is_claude=False)
        # res_llama_body = json.loads(res_llama['body'].read())
        # llama_keywords = keywords_from_str(extract_llama(res_llama_body))

        # keywords = list(set(claude_keywords).union(set(llama_keywords)))
        # print("claude", claude_keywords)
        # print("llama", llama_keywords)



        

        
        return {
            'statusCode': 200,
            'body': json.dumps('Success')
        }
    except Exception as e:
        logger.error(f"Error processing event: {str(e)}", exc_info=True)  # Add full exception info

        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }