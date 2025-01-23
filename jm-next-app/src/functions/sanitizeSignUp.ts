
export const handler = async (event: any): Promise<any>  => {
    
    console.log("sanitizeSignUp handler called. event:", event);
    console.log("tier:", event.request.userAttributes);

    try {
        
        const tier = event.request.userAttributes["custom:tier"]
        console.log("tier:", tier);

        if (!event.request.userAttributes.email) {
            console.log("Email is required");
            throw new Error("Email is required");
        }

        if (tier !== "free") {
            throw new Error("Invalid tier");
        }

        // Since this function is called by Cognito on postConfirmation, it expects the event returned
        return event
    } catch (error) {
        console.error("Error:", error)       
        throw new Error("Error sanitizing sign up: " + error);

    }
}