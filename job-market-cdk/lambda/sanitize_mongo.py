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
    
    try:
        canonicalize_extracted_keywords(collection)
    except Exception as e:
        logger.error(f"Error canonicalizing extracted keywords: {e}")
        return {"status": "ERROR", "message": str(e)}
    
    try:
        convert_salaries(collection)
    except Exception as e:
        logger.error(f"Error converting salaries: {e}")
        return {"status": "ERROR", "message": str(e)}

    return {"status": "complete", "message": "Cleaned MongoDB values."}


def convert_string_to_double(collection):
    # Query to find documents with string min_amount or max_amount
    query = {"$or": [{"min_amount": {"$type": "string"}}, {"max_amount": {"$type": "string"}}]}
    
    # Iterate over the documents and perform the conversion
    count = 0
    for document in collection.find(query):
        logger.info(f"Processing document ID: {document['_id']}")
        update_fields = {}
        
        # Convert min_amount to float if it's a string
        if isinstance(document.get("min_amount"), str):
            try:
                update_fields["min_amount"] = float(document["min_amount"])
            except ValueError:
                logger.warning(f"Could not convert min_amount to float for document ID {document['_id']}")
        
        # Convert max_amount to float if it's a string
        if isinstance(document.get("max_amount"), str):
            try:
                update_fields["max_amount"] = float(document["max_amount"])
            except ValueError:
                logger.warning(f"Could not convert max_amount to float for document ID {document['_id']}")
        
        # Update the document if there are fields to update
        if update_fields:
            collection.update_one({"_id": document["_id"]}, {"$set": update_fields})
            logger.info(f"Updated document ID: {document['_id']} with fields: {update_fields}")
            count += 1
    logger.info(f"Converted {count} documents to double")


# 2. Adjust salaries to yearly values in datatype 'double'
    # a) convert all min_amount and max_amount of type 'string' to 'double'
    # b) if has attribute 'interval', use that to convert to yearly values, if not already yearly
    # c) if does not have attribute 'interval', then we need to make an best guess.
            # high majorty of documents will be either hourly or yearly.
            

 # 1) get all fields with 'interval' with a value (not null), based on that -> calculate the wages and write to adj_min/max_amount
    # 2) for (values without 'interval' or is null) AND have min_amount & max_amount, read the value, then make a guess
    
    #     -> all these values will be under adj_min_amount and adj_max_amount
    return 

def convert_salaries(collection):
    # Query to find documents with an 'interval' field and valid min_amount and max_amount
    query_with_interval = {
        "interval": {"$exists": True, "$ne": None},
        "min_amount": {"$exists": True, "$ne": None, "$gt": 0},
        "max_amount": {"$exists": True, "$ne": None, "$gt": 0}
    }
    
    # Query to find documents without an 'interval' field but with valid min_amount and max_amount
    query_without_interval = {
        "$or": [
            {"interval": {"$exists": False}},
            {"interval": None}
        ],
        "min_amount": {"$exists": True, "$ne": None, "$gt": 0},
        "max_amount": {"$exists": True, "$ne": None, "$gt": 0}
    }
    
    # Process documents with an 'interval' field
    for document in collection.find(query_with_interval):
        logger.info(f"Processing document ID: {document['_id']} with interval")
        
        # Determine the conversion factor based on the interval
        interval = document['interval'].lower()
        conversion_factor = 1  # Default to yearly
        
        if interval == 'hourly':
            conversion_factor = 2080  # 40 hours/week * 52 weeks/year
        elif interval == 'daily':
            conversion_factor = 260 # 5 days/week * 52 weeks/year
        elif interval == 'weekly':
            conversion_factor = 52  # 52 weeks/year
        elif interval == 'monthly':
            conversion_factor = 12  # 12 months/year
        elif interval == 'yearly':
            conversion_factor = 1
        
        # Calculate adjusted amounts
        min_amount = document.get("min_amount") or 0
        max_amount = document.get("max_amount") or 0

        adj_min_amount = min_amount * conversion_factor
        adj_max_amount = max_amount * conversion_factor
        
        # Update the document with adjusted amounts
        collection.update_one(
            {"_id": document["_id"]},
            {"$set": {"adj_min_amount": adj_min_amount, "adj_max_amount": adj_max_amount}}
        )
        logger.info(f"Updated document ID: {document['_id']} with adjusted amounts: {adj_min_amount}, {adj_max_amount}")
    


        
    # for max_amount
    buckets = {
        'hourly': (0, 300),
        'daily': (301, 1000),
        'weekly': (1001, 5000),
        'monthly': (5001, 30000),
        'yearly': (30001, float('inf'))
    }

    
    # Process documents without an 'interval' field
    for document in collection.find(query_without_interval):
        logger.info(f"Processing document ID: {document['_id']} without interval")
        
        min_amount = document.get("min_amount") or 0
        max_amount = document.get("max_amount") or 0

        # default to yearly
        conversion_factor = 'yearly'

        for interval, (min_val, max_val) in buckets.items():
            if min_val <= max_amount <= max_val:
                conversion_factor = {
                    'hourly': 2080,
                    'daily': 260,
                    'weekly': 52,
                    'monthly': 12,
                    'yearly': 1
                }[interval]
                break

        # Calculate adjusted amounts
        adj_min_amount = min_amount * conversion_factor
        adj_max_amount = max_amount * conversion_factor

        # Update the document with adjusted amounts
        collection.update_one(
            {"_id": document["_id"]},
            {"$set": {"adj_min_amount": adj_min_amount, "adj_max_amount": adj_max_amount}}
        )
        logger.info(f"Updated document ID: {document['_id']} with adjusted amounts: {adj_min_amount}, {adj_max_amount}")

    logger.info("Completed salary conversion for all documents.")






def canonicalize_extracted_keywords(collection):
    keyword_mapping = {
        'react.js': 'React',
        'ReactJS': 'React',
        'react': 'React',
        'React.js': 'React',
        'reactjs': 'React',
        'React JS': 'React',
        'REACT': 'React',
        'React Query': 'React',
        'React.JS': 'React',
        'React Hooks': 'React',
        'React Router': 'React',
        'Reactjs': 'React',
        'React-Query': 'React',
        'React Js': 'React',

        'golang': 'Go',
        'Golang': 'Go',
        'GoLang': 'Go',
        'GO': 'Go',
        
        'Python 3': 'Python',
        'python': 'Python',
        'Python3': 'Python',
        'Python scripting': 'Python',
        'Python/Django': 'Python',
        'PYTHON': 'Python',
        'Spark Python': 'Python',

        'MS SQL': 'Microsoft SQL Server',
        'MS SQL Server': 'Microsoft SQL Server',
        'MSSQL': 'Microsoft SQL Server',
        'Microsoft SQL': 'Microsoft SQL Server',
        'MS-SQL': 'Microsoft SQL Server',
        'SQL Server': 'Microsoft SQL Server',
        'Microsoft SQL Server 2016': 'Microsoft SQL Server',
        'MSSQL Server': 'Microsoft SQL Server',
        
        'Django Rest Framework': 'Django',

        
        'Amazon Web Services (AWS)': 'AWS',
        'AWS services': 'AWS',
        'Amazon AWS': 'AWS',
        'AWS cloud': 'AWS',
        'aws': 'AWS',

        'git': 'Git',
        'GIT': 'Git',

        'github': 'GitHub',
        'Github': 'GitHub',
        'GITHUB': 'GitHub',

        'github actions': 'GitHub Actions',
        'Github Actions': 'GitHub Actions',
        'GitHub actions': 'GitHub Actions',
        'Github actions': 'GitHub Actions',
        'Github Action': 'GitHub Actions',

        'Google Cloud Platform': 'GCP',
        'Google Cloud': 'GCP',
        'Google Cloud Platform (GCP)': 'GCP',
        'Google GCP': 'GCP',
        'Google cloud': 'GCP',

        'Javascript': 'JavaScript',
        'javascript': 'JavaScript',
        'JavaScript (ES6+)': 'JavaScript',
        'JavaScript ES6': 'JavaScript',
        'JavaScript Frameworks': 'JavaScript',

        'NodeJS': 'Node.js',
        'Node': 'Node.js',
        'Node.JS': 'Node.js',
        'Node JS': 'Node.js',
        'node.js': 'Node.js',
        'NodeJs': 'Node.js',
        'Nodejs': 'Node.js',
        'node': 'Node.js',
        'Node Js': 'Node.js',
        'Node js': 'Node.js',

        'Typescript': 'TypeScript',
        'typescript': 'TypeScript',

        'NoSQL databases': 'NoSQL',
        'NoSQL Databases': 'NoSQL',
        'NOSQL': 'NoSQL',
        'noSQL': 'NoSQL',
        'NoSQL Database': 'NoSQL',
        'NoSQL database': 'NoSQL'

    }
    
    # Query to find documents where extracted_keywords is a non-empty array containing specific keywords to be canonicalized
    query = {
        "extracted_keywords": {
            "$type": "array",
            "$elemMatch": {"$in": list(keyword_mapping.keys())}
        }
    }
    
    # Iterate over all documents that match the query
    count = 0
    for document in collection.find(query):
        logger.info(f"Processing document ID: {document['_id']}")
        logger.info(f"Before update: {document['extracted_keywords']}")
        
        updated_keywords = []
        updated = False
        
        for keyword in document.get("extracted_keywords", []):
            if keyword in keyword_mapping:
                updated_keywords.append(keyword_mapping[keyword])
                updated = True
            else:
                updated_keywords.append(keyword)
        
        # Update the document if any keyword was updated
        if updated:
            collection.update_one({"_id": document["_id"]}, {"$set": {"extracted_keywords": updated_keywords}})
            logger.info(f"Updated document ID: {document['_id']} with new keywords: {updated_keywords}")
            
            # Read the document again to show the updated state
            updated_document = collection.find_one({"_id": document["_id"]})
            logger.info(f"After update: {updated_document['extracted_keywords']}")
            count += 1
        else:
            logger.info("No keywords were updated for document ID: {document['_id']}.")
    
    logger.info(f"Canonicalized keywords in {count} documents")
