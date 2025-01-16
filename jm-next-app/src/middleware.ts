import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { CognitoJwtVerifier } from 'aws-jwt-verify'

// Create verifier once, outside the middleware function
const verifier = CognitoJwtVerifier.create({
  userPoolId: String(process.env.NEXT_PUBLIC_USER_POOL_ID),
  tokenUse: "access",
  clientId: String(process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID),
});

export async function middleware(request: NextRequest) {
  const allCookies = Array.from(request.cookies.getAll());
  const accessTokenCookie = allCookies.find(cookie => cookie.name.includes('accessToken'));

  if (!accessTokenCookie) {
    // return NextResponse.redirect(new URL('/login', request.url));
    console.log("No access token cookie found");
    return NextResponse.next();
  }

  const accessToken: string = accessTokenCookie.value;
  console.log("accessToken:", accessToken);

  try {
    const payload = await verifier.verify(accessToken);

    if (request.nextUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    } 
    if (request.nextUrl.pathname === '/sign-up') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    console.log("Token is valid. Payload:", payload);
  } catch (err) {
    console.log("Token not valid!", err);

  }
  
  
  return NextResponse.next()
}