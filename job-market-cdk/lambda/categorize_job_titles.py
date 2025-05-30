import pymongo
import boto3
from pymongo import UpdateMany
from datetime import datetime
import os
import logging


# Init logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Initialize clients
mongo_client = pymongo.MongoClient(os.environ['MONGODB_URI'])
db = mongo_client[os.environ['MONGODB_DATABASE']]
collection = db[os.environ['MONGODB_COLLECTION']]

def handler(event, context):
    try:
        # Validate categorize_mode
        valid_modes = ["new_only", "all"]
        categorize_mode = event.get("categorize_mode")
        
        if not categorize_mode or categorize_mode not in valid_modes:
            error_msg = f"Invalid categorize_mode. Must be one of: {valid_modes}"
            logger.error(error_msg)
            return {"status": "error", "message": error_msg}

        # Set query based on mode
        if categorize_mode == "new_only":
            query = {
                "$or": [
                    {"categories": {"$exists": False}},
                    {"categories": {"$size": 0}}
                ]
            }
        else:  # "all"
            query = {}

        # Process documents
        updated_count = categorize_job_titles(collection, query)
        logger.info(f"Updated {updated_count} documents")
        
        return {
            "status": "success",
            "updated_count": updated_count,
            "mode": categorize_mode
        }

    except Exception as e:
        logger.error(f"Error categorizing job titles: {e}")
        return {"status": "error", "message": str(e)}


def categorize_job_titles(collection, query):
    """
    Categorizes job titles and updates documents with their categories.
    """
    # Project only the fields we need
    projection = {"title": 1, "_id": 1}
    
    updated_count = 0
    for doc in collection.find(query, projection):
        if not doc.get("title"):
            logger.warning(f"Document {doc['_id']} has no title field")
            continue
            
        # Parse the job title into categories
        categories = parse_job_title_hierarchy(doc["title"])
        
        # Update the document with the categories
        collection.update_one(
            {"_id": doc["_id"]},
            {"$set": {"categories": categories}}
        )
        updated_count += 1
        logger.info(f"Updated document {doc['title']} with categories: {categories}")
    
    return updated_count

def parse_job_title_hierarchy(title: str) -> list[str]:
    """
    Parses a job title into hierarchical parts.
    Returns an array of parts from most general to most specific.
    """
    hierarchy = []
    lt = title.lower()
    
    def _has(s: str) -> bool:
        return s in lt
    
    def has(words: list[str]) -> bool:
        return any(_has(word) for word in words)
    
    def p(s: str):
        hierarchy.append(s)

    # Security
    if has(["security", "cyber", "threat", "soc", "cybersecurity"]):
        p("Security")
        if has(["soc"]):
            p("SOC")
        elif has(["devsecops"]):
            p("DevSecOps")
        elif has(["analyst"]):
            p("Analyst")
        elif has(["engineer"]):
            p("Engineer")
        elif has(["architect"]):
            p("Architect")
        else:
            p("Other")    

    # UI/UX
    elif has(["ui/", "ui ", "/ux ", "ui/ux", "user interface", "user experience"]):
        p("UI/UX")
        p("Other")

    # AI/ML
    elif has(["ai", "artificial intelligence", "ml", "machine learning"]):
        p("AI")
        if has(["ml", "machine learning"]):
            p("Machine Learning")
        elif has(["llm", "agent", "fine tune"]):
            p("LLM/Agents")
        else:
            p("Other")

    # Web Development
    elif has(["full stack", "fullstack", "full-stack", "back end", "backend", "back-end", 
              "front end", "frontend", "front-end", "web developer"]):
        p("Web Development")
        if has(["full stack", "fullstack", "full-stack"]):
            p("Full Stack")
        elif has(["backend", "back end", "back-end"]):
            p("Backend")
        elif has(["frontend", "front end", "front-end"]):
            p("Frontend")
        else:
            p("Other")

    # Systems
    elif has(["firmware", "embedded", "hardware", "verilog", "systems", "automation"]):
        p("Systems")
        if has(["firmware"]):
            p("Firmware")
        elif has(["embedded"]):
            p("Embedded")
        elif has(["hardware"]):
            p("Hardware")
        elif has(["automation"]):
            p("Automation")
        else:
            p("Other")

    # Mobile
    elif has(["mobile", "ios", "android", "swift", "flutter", "react native", "lynx"]):
        p("Mobile")
        if has(["ios", "swift"]):
            p("iOS")
        elif has(["android", "kotlin"]):
            p("Android")
        elif has(["lynx", "react native", "flutter"]):
            p("Cross-Platform")
        else:
            p("Other")

    # Infrastructure
    elif has(["dev ops", "devops", "dev-ops", "dev-op", "infrastructure", "infra", 
              "sysadmin", "sys-admin", "system admin", "system administrator", 
              "cloud", "network", "networks", "networking", "it"]):
        p("Infrastructure")
        if has(["dev ops", "devops", "dev-ops", "dev-op"]):
            p("DevOps")
        elif has(["infrastructure", "infra"]):
            p("Infrastructure")
        elif has(["sysadmin", "sys-admin", "system admin", "system administrator"]):
            p("SysAdmin")
        elif has(["cloud"]):
            p("Cloud")
        elif has(["network", "networks", "networking"]):
            p("Networking")
        elif has(["it"]):
            p("IT")
        else:
            p("Other")

    # Data
    elif _has("data"):
        p("Data")
        if _has("scientist"):
            p("Data Scientist")
        elif _has("engineer"):
            p("Data Engineer")
        elif _has("analyst"):
            p("Data Analyst")
        elif _has("architect"):
            p("Data Architect")
        else:
            p("Other")

    # Software Engineering
    elif has(["software engineer", "developer", "software development", 
              "software engineering", "programmer", "sde"]):
        p("Software Engineering")
        if has(["senior", "lead", "principal", "staff", "sr"]):
            p("Senior")
        elif _has("junior"):
            p("Junior")
        else:
            p("Other")

    # QA
    elif has(["qa", "quality assurance", "quality control", "quality engineer", 
              "quality assurance engineer", "quality control engineer", "test"]):
        p("QA")
        p("Other")
    else:
        p("Other")

    return hierarchy