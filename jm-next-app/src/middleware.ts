import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { CognitoJwtVerifier } from 'aws-jwt-verify'

// Create verifier once, outside the middleware function
const verifier = CognitoJwtVerifier.create({
  userPoolId: String(process.env.NEXT_PUBLIC_USER_POOL_ID),
  tokenUse: "id",
  clientId: String(process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID),
});

export async function middleware(request: NextRequest) {
  const allCookies = Array.from(request.cookies.getAll());
  const idTokenCookie = allCookies.find(cookie => cookie.name.includes('idToken'));

  let validToken = false;
  let tier = 'free';

  // check the validity and tier
  if (idTokenCookie) {

    try {
      const payload = await verifier.verify(idTokenCookie.value);
      validToken = true;
      tier = String(payload["custom:tier"])

    } catch (err) {
      // refresh here?
      console.log("Token not valid!", err);

    }
  }



  // block login/sign up page if already logged in
  // TODO: what happens when their token is stale? should check tokens in middleware>>>?
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/sign-up') && validToken) {
    return NextResponse.redirect(new URL('/', request.url));
  } 


  // Must have premium
  if (request.nextUrl.pathname.startsWith('/analytics/search') && tier != 'premium') {
      return NextResponse.redirect(new URL('/pricing', request.url))
  }

  // Route needs basic or premium
  if (request.nextUrl.pathname.startsWith('/analytics/skills-connectivity') && tier == 'free') {
    return NextResponse.redirect(new URL('/pricing', request.url))
}

  return NextResponse.next()

  
  
  
}

export const config = {
  matcher: ['/profile', '/login', '/sign-up', '/analytics/:path*'],
}