import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToDatabase } from "@/lib/mongoClient";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>  => {
    
    const db = await connectToDatabase();
    console.log("Database connected successfully");


    try {
        // Temporarily only getting jobs from indeed
        const result = await db.collection('JobPostings').find({"site": "indeed"}).sort({date_posted: -1}).limit(100).toArray();
        console.log("RESULTS: ", result)
        return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(result)
        };
    } catch (error) {
        console.error(error)
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
    }
}