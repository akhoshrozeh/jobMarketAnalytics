import { connectToDatabase } from "@/lib/mongoCreateUpdateUserClient";
import { Stripe } from "stripe";
import { Resource } from "sst";


export const handler = async (event: any): Promise<any>  => {

    const basicPriceId = Resource.BasicMembershipPriceId.value
    const premiumPriceId = Resource.PremiumMembershipPriceId.value
    
    console.log("webhook handler called. event:", event);

    let stripe;
    let stripeEvent;

    try {
        stripe = new Stripe(Resource.STRIPE_SECRET_KEY.value);
        stripeEvent = stripe.webhooks.constructEvent(
            event.body,
            event.headers['stripe-signature'],
            Resource.STRIPE_WEBHOOK_SIG.value
        );
        
    } catch (err) {
        console.log(`Stripe webhook signature verification failed: ${err}`);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: err  })
        }
    }

    
    // console.log("StripeEvent: ", stripeEvent)
    // console.log("EventType: ", eventType)
    // console.log("StripeEventDetails: ", stripeEvent.data.object.customer_details)
    // console.log("StripeEventDetails: ", stripeEvent.data.object.metadata.jobTrenderEmail)
    
    const eventType = stripeEvent.type ? stripeEvent.type : '';
    
    console.log('eventType:', eventType)

    
    // Extract data from Stripe event
    try {
        const db = await connectToDatabase();
        const jobTrenderEmail = stripeEvent.data.object.metadata.jobTrenderEmail;
        const user = await db.collection("Users").findOne({ email: jobTrenderEmail });
        console.log("useR", user)



        switch (eventType) {
            case 'checkout.session.completed': {
                console.log("hereeeee")
                const session = await stripe.checkout.sessions.retrieve(
                    stripeEvent.data.object?.id,
                    {
                        expand: ['line_items']
                    }
                )

                console.log('session', session.line_items?.data[0]?.price?.id)
                const purchasedPriceId = session.line_items?.data[0]?.price?.id;

                if (purchasedPriceId == basicPriceId) {
                    console.log("basic purchased")
                } 
                else if (purchasedPriceId == premiumPriceId) {
                    console.log("premium purchased")

                }

                break;

            }

            case '': {
                break;

            }

            default: {
                break;
            }
        }
    } catch (err) {
        console.error("Error processing webhook:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error" })
        }

    }



    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Stripe webhook successfully processed." })
    }

    // const initDate = new Date()

    // try {

    //     // Validate required fields
    //     if (!event.userName) {
    //         throw new Error("Username is required");
    //     }
    //     if (!event.request?.userAttributes?.email) {
    //         throw new Error("Email is required");
    //     }


    //     const userDocument = {
    //         username: event.userName,
    //         email: event.request.userAttributes.email,
    //         firstName: "",
    //         lastName: "",
    //         createdAt: initDate,
    //         updatedAt: initDate,
    //         tier: "free",
    //         profilePicture: "",
    //         resume: "",
    //         skills: [], // user's skills 
    //         applications: [], // tracks a user
    //     }

    //     await db.collection("Users").insertOne(userDocument)

    //     // Since this function is called by Cognito on postConfirmation, it expects the event returned
    //     return event
    // } catch (error) {
    //     console.error("Error:", error)       
    //     return event 
    // }
}