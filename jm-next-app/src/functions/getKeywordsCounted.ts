import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToDatabase } from "@/lib/mongoClient";


export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>  => {
    const db = await connectToDatabase();
    console.log("get-keywords-counted handler called");
    console.log(event.queryStringParameters?.tier);

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
          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=3600"
            },
            body: JSON.stringify(result)
          };

    } catch (error) {
        console.log("error:", error)
        return {
            statusCode: 500,
            body: JSON.stringify({message: error})
        }

    }



}


