import { cookies } from 'next/headers'

// returns cookie if there's an access token but doesn't verify
// this is for the UI but doesn't matter for security reasons (e.g. Loading the navbar)
export async function existsAccessToken() {
    const cookieStore = await cookies();
    const allCookies = Array.from(cookieStore.getAll());
    const accessTokenCookie = allCookies.find(cookie => cookie.name.includes('accessToken'));
    return accessTokenCookie ? accessTokenCookie.value : false;
  }

export async function existsIdToken() {
    const cookieStore = await cookies();
    const allCookies = Array.from(cookieStore.getAll());
    const idTokenCookie = allCookies.find(cookie => cookie.name.includes('idToken'));
    return idTokenCookie ? idTokenCookie.value : false;
  }