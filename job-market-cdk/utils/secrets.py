import boto3
import json
from aws_cdk import CfnOutput

def get_mongodb_uri(): 
    secret_name = "mongodb/jobMarketWriter"
    region_name = "us-east-1"

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        raise e

    secrets = get_secret_value_response['SecretString']
    secret_dict = json.loads(secrets)
    mongodb_uri_secret = secret_dict['MONGODB_URI']

    return mongodb_uri_secret

def get_db_collection():
    secret_name = "mongodb/jobMarketWriter"
    region_name = "us-east-1"

    # Create a Secrets Manager client   
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        raise e

    secrets = get_secret_value_response['SecretString']
    secret_dict = json.loads(secrets)
    mongodb_db = secret_dict['database']    
    mongodb_collection = secret_dict['collection']

    return mongodb_db, mongodb_collection

