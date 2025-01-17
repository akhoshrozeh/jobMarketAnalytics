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
  console.log("PATH:", request.nextUrl.pathname);
  console.log("ACCESS TOKEN COOKIE:", accessTokenCookie);
  console.log("ACCESS TOKEN COOKIE VALUE:", accessTokenCookie?.value);


  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/sign-up') && accessTokenCookie !== undefined) {
    return NextResponse.redirect(new URL('/', request.url));
  } 


  // Check jwt
  if (request.nextUrl.pathname.startsWith('/profile') && accessTokenCookie) {

    const accessToken: string = accessTokenCookie.value;

    try {
      const payload = await verifier.verify(accessToken);
      console.log("Token is valid. Payload:", payload);
      
    
    } catch (err) {
      console.log("Token not valid!", err);
      return NextResponse.redirect(new URL('/', request.url));

    }
  }

  return NextResponse.next()

  
  
  
}

export const config = {
  matcher: ['/profile', '/login', '/sign-up'],
}