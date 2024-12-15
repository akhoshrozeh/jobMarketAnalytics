import json
import pymongo
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)
# Connection Pooling
client = pymongo.MongoClient(os.environ['MONGODB_URI'])

def handler(event, context): 

    
    try:
        processed_data = event['detail']['processed_data']
        db = client[os.environ['MONGODB_DATABASE']]
        collection = db[os.environ['MONGODB_COLLECTION']]
        logger.info(f"Attempting to write {processed_data['id']} to MongoDB...")

       
        # Use update_one with upsert instead of insert_one
        result = collection.update_one(
            {'id': processed_data['id']},  # filter by id
            {'$set': processed_data},      # update/set all fields
            upsert=True                    # insert if doesn't exist
        )

        if result.upserted_id:
            logger.info(f"New document inserted with id: {result.upserted_id}")
        else:
            logger.info(f"Document was not upserted")

        
        return {
            'statusCode': 200,
            'body': json.dumps('Data written to MongoDB')
        }
    except Exception as e:
        logger.error("Error writing to MongoDB: ", e)
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }