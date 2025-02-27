"use server";
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { cookies } from 'next/headers'

export type TokenVerificationResult = {
    valid: boolean;
    expired: boolean;
    payload?: any;
  }

// Create verifier once, outside the middleware function
const verifierAccessToken = CognitoJwtVerifier.create({
    userPoolId: String(process.env.NEXT_PUBLIC_USER_POOL_ID),
    tokenUse: "access",
    clientId: String(process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID),
});

const verifierIdToken = CognitoJwtVerifier.create({
    userPoolId: String(process.env.NEXT_PUBLIC_USER_POOL_ID),
    tokenUse: "id",
    clientId: String(process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID),
});


export async function verifyAccessToken() {

    const cookieStore = await cookies();
    const allCookies = Array.from(cookieStore.getAll());
    const accessTokenCookie = allCookies.find(cookie => cookie.name.includes('accessToken'));

    if (!accessTokenCookie) {
        console.log("No access token cookie found");
        return { valid: false, expired: false };
    }


    try {
        const payload = await verifierAccessToken.verify(accessTokenCookie.value);
        return { valid: true, expired: false, payload };

    } catch (err) {
        if (err instanceof Error && err.message.includes("Token expired")) {
            console.log("Token expired");
            return { valid: false, expired: true };

        } else {
            console.log("Token not valid!", err);
            return { valid: false, expired: false };
        }
    }

  }


export async function verifyIdToken() {
    const cookieStore = await cookies();
    const allCookies = Array.from(cookieStore.getAll());
    const idTokenCookie = allCookies.find(cookie => cookie.name.includes('idToken'));

    if (!idTokenCookie) {
        console.log("No id token cookie found");
        return { valid: false, expired: false };
    }

    try {
        const payload = await verifierIdToken.verify(idTokenCookie.value);
        return { valid: true, expired: false, payload };
    } catch (err) {

        if (err instanceof Error && err.message.includes("Token expired")) {
            console.log("Token expired");
            return { valid: false, expired: true };

        } else {
            console.log("Token not valid!", err);
            return { valid: false, expired: false };
        }


    }

}