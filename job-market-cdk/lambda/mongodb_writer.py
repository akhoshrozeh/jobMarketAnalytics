import json
import pymongo
import os

def handler(event, context):
    
    client = pymongo.MongoClient(os.environ['MONGODB_URI'])
    db = client['your_database']
    collection = db['your_collection']
    
    try:
        for record in event['Records']:
            detail = json.loads(record['body'])
            processed_data = detail['processed_data']
            
            # Write processed data to MongoDB
            collection.insert_one(processed_data)
        
        return {
            'statusCode': 200,
            'body': json.dumps('Data written to MongoDB')
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }