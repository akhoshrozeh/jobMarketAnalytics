import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToDatabase } from "@/lib/mongoCreateUserClient";


export const handler = async (event: any): Promise<any>  => {
    
    const db = await connectToDatabase();
    console.log("createUser handler called. event:", event);

    const initDate = new Date()

    try {

        // Validate required fields
        if (!event.userName) {
            throw new Error("Username is required");
        }
        if (!event.request?.userAttributes?.email) {
            throw new Error("Email is required");
        }


        const userDocument = {
            username: event.userName,
            email: event.request.userAttributes.email,
            firstName: "",
            lastName: "",
            createdAt: initDate,
            updatedAt: initDate,
            tier: "free",
            profilePicture: "",
            resume: "",
            skills: [], // user's skills 
            applications: [], // tracks a user
        }

        await db.collection("Users").insertOne(userDocument)

        // Since this function is called by Cognito on postConfirmation, it expects the event returned
        return event
    } catch (error) {
        console.error("Error:", error)       
        return event 
    }
}