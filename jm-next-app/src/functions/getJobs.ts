import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToDatabase } from "@/lib/mongoClient";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>  => {
    
    const db = await connectToDatabase();
    console.log("get-jobs handler called");


    try {
        // Temporarily only getting jobs from indeed
        const result = await db
        .collection('JobPostings')
        .find({"site": "indeed"},
            {
                projection: {
                    _id: 1,
                    title: 1,
                    company: 1,
                    location: 1,
                    date_posted: 1,
                    site: 1
                }
            }
        )
        .sort({date_posted: -1})
        .limit(100)
        .toArray();

        return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=3600"
            },
            body: JSON.stringify(result)
        };
    } catch (error) {
        console.error(error)
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
    }
}