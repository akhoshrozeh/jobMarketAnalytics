import { connectToDatabase } from "@/lib/mongoCreateUpdateUserClient";


export const handler = async (event: any): Promise<any>  => {
    
    const db = await connectToDatabase();
    console.log("createUser invoked");

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
            username: event.request.userAttributes.sub,
            email: event.request.userAttributes.email,
            createdAt: initDate,
            updatedAt: initDate,
            tier: "free",
        }

        await db.collection("Users").insertOne(userDocument)
        
        
    } catch (error) {
        console.error("Error:", error)       
        
    // Since this function is called by Cognito on postConfirmation, it expects the event returned
    } finally {
        return event
    }
}