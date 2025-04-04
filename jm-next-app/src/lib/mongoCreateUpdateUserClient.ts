import { Resource } from "sst"
import * as mongodb from "mongodb";

const MongoClient = mongodb.MongoClient;
const mongoURI = Resource.CreateUserURI.value;
const db = Resource.JobTrendrAppDB.value;

let cachedDb: mongodb.Db | null = null;

export async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  // Connect to our MongoDB database hosted on MongoDB Atlas
  const client = await MongoClient.connect(mongoURI);

  // Specify which database we want to use
  cachedDb = await client.db(db);

  return cachedDb;
}