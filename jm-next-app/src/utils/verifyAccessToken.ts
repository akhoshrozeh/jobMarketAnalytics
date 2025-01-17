import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { cookies } from 'next/headers'

// Create verifier once, outside the middleware function
const verifier = CognitoJwtVerifier.create({
    userPoolId: String(process.env.NEXT_PUBLIC_USER_POOL_ID),
    tokenUse: "access",
    clientId: String(process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID),
});

export default async function verifyAccessToken() {

    const cookieStore = await cookies();
    const allCookies = Array.from(cookieStore.getAll());
    const accessTokenCookie = allCookies.find(cookie => cookie.name.includes('accessToken'));

    if (!accessTokenCookie) {
        console.log("No access token cookie found");
        return false;
    }


    try {
        const payload = await verifier.verify(accessTokenCookie.value);
        return payload;
    } catch {
        console.log("Token not valid!");
        return false;
    }

  }