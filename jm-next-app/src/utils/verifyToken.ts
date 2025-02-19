import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { cookies } from 'next/headers'

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
        return false;
    }


    try {
        const payload = await verifierAccessToken.verify(accessTokenCookie.value);
        return payload;
    } catch (err) {
        console.log("Token not valid!", err);
        return false;
    }

  }


export async function verifyIdToken() {
    const cookieStore = await cookies();
    const allCookies = Array.from(cookieStore.getAll());
    const idTokenCookie = allCookies.find(cookie => cookie.name.includes('idToken'));

    if (!idTokenCookie) {
        console.log("No id token cookie found");
        return null;
    }

    try {
        const payload = await verifierIdToken.verify(idTokenCookie.value);
        return payload;
    } catch (err) {
        console.log("Token not valid!", err);
        return null;
    }

}