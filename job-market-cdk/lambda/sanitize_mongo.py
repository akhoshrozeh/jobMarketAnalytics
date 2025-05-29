
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


# 1. Clean up extracted_keyword values such that skills have canonical names
    # e.g. react, React, React.js, reactjs -----become----> React

# 2. Adjust salaries to yearly values in datatype 'double'
    # a) convert all min_amount and max_amount of type 'string' to 'double'
    # b) if has attribute 'interval', use that to convert to yearly values, if not already yearly
    # c) if does not have attribute 'interval', then we need to make an best guess.
            # high majorty of documents will be either hourly or yearly. 
def handler(event, context):

    try:
        convert_string_to_double(collection)
    except Exception as e:
        logger.error(f"Error converting string to double: {e}")
        return {"status": "ERROR", "message": str(e)}

    return {"status": "complete", "message": "Cleaned MongoDB values."}


def convert_string_to_double(collection):
    # Convert all min_amount and max_amount values from string to double
    for document in collection.find({"$or": [{"min_amount": {"$type": "string"}}, {"max_amount": {"$type": "string"}}]}):
        logger.info(f"Document: {document['min_amount']}")
        # update_fields = {}
        
        # if isinstance(document.get("min_amount"), str):
        #     try:
        #         update_fields["min_amount"] = float(document["min_amount"])
        #     except ValueError:
        #         logger.warning(f"Could not convert min_amount to float for document ID {document['_id']}")
        
        # if isinstance(document.get("max_amount"), str):
        #     try:
        #         update_fields["max_amount"] = float(document["max_amount"])
        #     except ValueError:
        #         logger.warning(f"Could not convert max_amount to float for document ID {document['_id']}")
        
        # if update_fields:
        #     collection.update_one({"_id": document["_id"]}, {"$set": update_fields})