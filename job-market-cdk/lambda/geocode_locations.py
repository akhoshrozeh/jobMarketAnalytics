import pymongo
import boto3
from pymongo import UpdateMany
from datetime import datetime
import os
import logging
import time
# Init logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Initialize clients
client = boto3.client('geo-places')
mongo_client = pymongo.MongoClient(os.environ['MONGODB_URI'])
db = mongo_client[os.environ['MONGODB_DATABASE']]
collection = db[os.environ['MONGODB_COLLECTION']]



def handler(event, context):
    
    # Process in batches to control memory usage
    batch_size = 500

    # Normalize locations
    # clean_locations(collection)


    query = {
        'location': {'$exists': True, '$ne': None, '$ne':""},
        'location_coords': {'$exists': False},
    }
    
    # Get unique locations in current batch
    pipeline = [
        {'$match': query},
        {'$group': {'_id': '$location'}},
        {'$limit': batch_size},
        {'$project': {'_id': 1, 'location': 1}}
    ]

    # Get unprocessed locations from mongo
    try:
        locations = list(collection.aggregate(pipeline))
        logger.info(f"{len(locations)} unprocessed locations found.")
    except Exception as e:
        logger.info(f"Error: {e}")
        return {"status": "ERROR", "message": str(e)}



    processed_locations = []
    logger.info(f"Geocoding {len(locations)} locations...")
    # Add delay between requests to stay under rate limit
    for location in locations:
        try:
            # Sleep 0.6s between requests to stay under 100 req/min limit
            time.sleep(0.6)
            res = client.geocode(QueryText=location['_id'], MaxResults=1, IntendedUse='Storage')
            location['location_coords'] = res['ResultItems'][0].get('Position', None)
            location['location_mapview'] = res['ResultItems'][0].get('MapView', None)
            processed_locations.append(location)
        except Exception as e:
            logger.info(f"Error: Failed to geocode location {location['_id']}: {e}")


    logger.info(f"{len(processed_locations)} processed_locations: {processed_locations}")
    logger.info(f"Writing to MongoDB...")
    
    # Batch update all documents with these locations
    try:
        bulk_ops = []
        for location in processed_locations:
            bulk_ops.append(
                UpdateMany(
                    {'location': location['_id']},
                    {'$set': {
                        'location_coords': location['location_coords'],
                        'location_mapview': location['location_mapview']
                    }}
                )
            )
            
        if bulk_ops:
            collection.bulk_write(bulk_ops, ordered=False)
            
        print(f"Processed {len(processed_locations)} locations in this batch")
    except Exception as e:
        logger.error(f"Error: failed to update locations in MongoDB: {e}")
        return {"status": "ERROR", "message": str(e)}
    
    logger.info(f"Successfully updated {len(processed_locations)} locations in MongoDB")
    return {"status": "complete", "processed": len(processed_locations)}



def clean_locations(collection):
    pipeline = [
        {
            '$match': {
                'location': {'$regex': ', US$'}  # Find locations ending with ", US"
            }
        },
        {
            '$addFields': {
                'location': {
                    '$substr': [
                        '$location',
                        0,
                        {'$subtract': [{'$strLenCP': '$location'}, 4]}  # Remove last 4 chars (", US")
                    ]
                }
            }
        },
        {
            '$merge': {
                'into': os.environ['MONGODB_COLLECTION'],
                'on': '_id',
                'whenMatched': 'replace',
                'whenNotMatched': 'discard'
            }
        }
    ]

    result = collection.aggregate(pipeline)
    logger.info(f"Result: {result}")
    logger.info("Location normalization complete")
    return {"status": "complete"}