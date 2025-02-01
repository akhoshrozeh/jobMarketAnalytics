import { connectToDatabase } from "@/lib/mongoCreateUpdateUserClient";
import { Stripe } from "stripe";
import { Resource } from "sst";
import { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider";

export const handler = async (event: any): Promise<any>  => {

    const basicPriceId = Resource.BasicMembershipPriceId.value
    const premiumPriceId = Resource.PremiumMembershipPriceId.value

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
        console.log(`Error: Stripe webhook signature verification failed: ${err}`);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: err  })
        }
    }

    
    
    // Extract data from Stripe event
    try {
        const db = await connectToDatabase();

        const eventType = stripeEvent.type ? stripeEvent.type : '';
        const jobTrenderEmail = (stripeEvent.data.object as any).metadata.metadata_email ;
        const username = (stripeEvent.data.object as any).metadata.metadata_username;

        switch (eventType) {
            
            case 'checkout.session.completed': {

                // Need to get the session to see what was purchased
                const session = await stripe.checkout.sessions.retrieve(
                    (stripeEvent.data.object as any)?.id,
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

                // User bought Basic plan
                if (purchasedPriceId == basicPriceId) {
                    console.log(`${jobTrenderEmail} purchased basic membership.`);

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

                    if (response.$metadata.httpStatusCode != 200) {
                        const err = `AdminUpdateUserAttributes returned HTTP response code ${response.$metadata.httpStatusCode}. Cognito User info was not updated.`;
                        throw new Error(err)
                    }

                    const res = await db.collection("Users").updateOne(
                        { username: username },
                        { $set: { tier: "premium", updatedAt: new Date() }}
                    )
                    if (res.modifiedCount != 1) {
                        throw new Error("User document was not updated in MongoDB")
                    }
                    
                    
                } 

                // User bought Premium plan
                else if (purchasedPriceId == premiumPriceId) {
                    console.log(`${jobTrenderEmail} purchased premium membership.`);

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
 
                    if (response.$metadata.httpStatusCode != 200) {
                        const err = `AdminUpdateUserAttributes returned HTTP response code ${response.$metadata.httpStatusCode}. Cognito User info was not updated.`;
                        throw new Error(err)
                    }

                    const res = await db.collection("Users").updateOne(
                        { username: username },
                        { $set: { tier: "premium", updatedAt: new Date() }}
                    )
                    if (res.modifiedCount != 1) {
                        throw new Error("User document was not updated in MongoDB")
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
}