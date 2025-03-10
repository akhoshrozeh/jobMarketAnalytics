import { Resource } from "sst"
import * as mongodb from "mongodb";

const MongoClient = mongodb.MongoClient;
const mongoURI = Resource.MongoReadURI.value;
const db = Resource.JobsDatabase.value;

let cachedDb: mongodb.Db | null = null;

export async function connectToDatabase() {
  if (cachedDb) {
    console.log("Returning cached database connection...");
    return cachedDb;
  }

  console.log("Creating new database connection...");
  // Connect to our MongoDB database hosted on MongoDB Atlas
  const client = await MongoClient.connect(mongoURI);

  // Specify which database we want to use
  cachedDb = client.db(db);

  return cachedDb;
}

export type MongoDBClient = mongodb.Db;