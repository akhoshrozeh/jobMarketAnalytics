import pymongo
import boto3
import logging
import os
import collections
import json
import time

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

client = pymongo.MongoClient(os.environ['MONGODB_URI'])

def handler(event, context):

    path = "data/indeed/"
    logger.info("Syncing S3 and MongoDB")

    event_bus = boto3.client('events')
    s3_client = boto3.client('s3')

    db = client[os.environ['MONGODB_DATABASE']]
    mongo_collection = db[os.environ['MONGODB_COLLECTION']]

    s3 = boto3.resource('s3')
    bucket = s3.Bucket('jobmarketcdkstack-jobpostingsrawdata17ac4b34-xtq8mdxqkiba')
    indeed_keys = []

    for obj in bucket.objects.filter(Prefix='data/indeed/').all():
        indeed_keys.append(obj.key)
    logger.info(f"Found {len(indeed_keys)} Indeed objects")


    # Getting ids from MongoDB
    mongo_ids = []
    for doc in mongo_collection.find({}, {'id': 1, '_id': 0}):
        mongo_ids.append("data/indeed/" + doc['id'] + ".json")
    logger.info(f"Found {len(mongo_ids)} MongoDB ids")


    # Find missing records by comparing keys
    missing_recs = set(indeed_keys) - set(mongo_ids)
    logger.info(f"Found {len(missing_recs)} missing records")

    # Pass each missing record (from mongo) into the pipeline for processing and writing to mongo
    for record in missing_recs:
        time.sleep(0.5)
            
        response = s3_client.get_object(Bucket="jobmarketcdkstack-jobpostingsrawdata17ac4b34-xtq8mdxqkiba", Key=record)
        object_data = response['Body'].read().decode('utf-8')
        # Log the object data
        logger.info(f"Object data: {object_data}")
        
        # Convert the object data to JSON if needed
        detail_data = json.loads(object_data)
        logger.info(f"to json: {detail_data}")

        event_bus.put_events(
            Entries=[
                {
                    'Source': 'sync_s3_mongo',
                    'DetailType': 'SyncS3MongoEvent',
                    'EventBusName': os.environ['EVENT_BUS_NAME'],
                    'Detail': json.dumps(detail_data)
                }
            ]
        )


