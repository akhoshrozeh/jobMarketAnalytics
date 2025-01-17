import { cookies } from 'next/headers'

// returns true if there's an access token but doesn't verify
// this is for the UI but doesn't matter for security reasons (e.g. Loading the navbar)
export default async function existsAccessToken() {
    const cookieStore = await cookies();
    const allCookies = Array.from(cookieStore.getAll());
    const accessTokenCookie = allCookies.find(cookie => cookie.name.includes('accessToken'));
    return accessTokenCookie ? true : false;
  }