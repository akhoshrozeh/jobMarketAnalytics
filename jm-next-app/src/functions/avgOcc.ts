import { Resource } from "sst"
import * as mongodb from "mongodb";

const MongoClient = mongodb.MongoClient;
const mongoURI = Resource.MongoReadURI.value;
const db = Resource.JMDatabase.value;

let cachedDb: any = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  // Connect to our MongoDB database hosted on MongoDB Atlas
  const client = await MongoClient.connect(mongoURI);

  // Specify which database we want to use
  cachedDb = await client.db(db);

  return cachedDb;
}

export const handler = async (event: any) => {
    const db = await connectToDatabase();

    try {   
        const pipeline = [
            {
              $match: {
                extracted_keywords: { $exists: true, $ne: [] }
              }
            },
            {
              $unwind: "$extracted_keywords"
            },
            {
              $group: {
                _id: "$extracted_keywords",
                totalOccurrences: { $sum: 1 }
              }
            },
            {
              $sort: { totalOccurrences: -1 }
            },
            {
              $limit: 100
            }
          ];
      
          const result = await db.collection('JobPostings').aggregate(pipeline).toArray();
          console.log(result)
          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(result)
          };

    } catch (error) {
        console.log("error:", error)
        return error
    }


}


