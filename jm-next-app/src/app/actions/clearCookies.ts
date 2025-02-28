'use server';

import { cookies } from 'next/headers';

export async function clearAuthCookies() {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    allCookies.forEach(cookie => {
        if (cookie.name.includes('CognitoIdentityServiceProvider')) {
            cookieStore.delete(cookie.name);
        }
    });
  
    return { success: true };
}