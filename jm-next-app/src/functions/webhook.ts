import { connectToDatabase } from "@/lib/mongoCreateUpdateUserClient";
import { Stripe } from "stripe";
import { Resource } from "sst";
import { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider";

export const handler = async (event: any): Promise<any>  => {

    const basicPriceId = Resource.BasicMembershipPriceId.value
    const premiumPriceId = Resource.PremiumMembershipPriceId.value
    
    // console.log("webhook handler called. event:", event);

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
        console.log("stripeEvent.data.object: ", stripeEvent.data.object)
        const jobTrenderEmail = stripeEvent.data.object.metadata.metadata_email;
        const username = stripeEvent.data.object.metadata.metadata_username;
        console.log("jobTrenderEmail: ", jobTrenderEmail)
        console.log("username: ", username)


        // const user = await db.collection("Users").findOne({ email: jobTrenderEmail });
        // console.log("useR", user)



        switch (eventType) {
            case 'checkout.session.completed': {
                console.log("hereeeee")

                // Need to get the session to see what was purchased
                const session = await stripe.checkout.sessions.retrieve(
                    stripeEvent.data.object?.id,
                    {
                        expand: ['line_items']
                    }
                )
                const purchasedPriceId = session.line_items?.data[0]?.price?.id;

            
                // Connect to Cognito to update user attribute "tier" after purchase
                const config = {
                    userPoolId: String(process.env.NEXT_PUBLIC_USER_POOL_ID),
                    userPoolClientId: String(process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID),
                    identityPoolId: String(process.env.NEXT_PUBLIC_IDENTITY_POOL_ID),
                }
                const cognitoClient = new CognitoIdentityProviderClient(config)


                

                


                if (purchasedPriceId == basicPriceId) {
                    console.log("basic purchased");

                    const input = {
                        UserAttributes: [ 
                            {
                                Name: "custom:tier",
                                Value: "basic"
                            }   
                        ],
                        UserPoolId: String(process.env.NEXT_PUBLIC_USER_POOL_ID),
                        Username: username,
                        
                    }
                    
                    const command = new AdminUpdateUserAttributesCommand(input);
                    const response = await cognitoClient.send(command);
                    console.log("response: ", response)
                    if (response.$metadata.httpStatusCode != 200) {
                        const err = `AdminUpdateUserAttributes returned HTTP response code ${response.$metadata.httpStatusCode}. User info was not updated.`;
                        throw new Error(err)
                    }
                    
                    
                } 

                // User bought premium
                else if (purchasedPriceId == premiumPriceId) {
                    console.log("premium purchased")

                    const input = {
                        UserAttributes: [ 
                            {
                                Name: "custom:tier",
                                Value: "premium"
                            }   
                        ],
                        UserPoolId: String(process.env.NEXT_PUBLIC_USER_POOL_ID),
                        Username: username,
                        
                    }
                    
                    const command = new AdminUpdateUserAttributesCommand(input);
                    const response = await cognitoClient.send(command);
                    console.log("response: ", response)
                    if (response.$metadata.httpStatusCode != 200) {
                        const err = `AdminUpdateUserAttributes returned HTTP response code ${response.$metadata.httpStatusCode}. User info was not updated.`;
                        throw new Error(err)
                    }
                    

                }

                // TODO: User upgrades from basic to premium

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