import { json } from '@sveltejs/kit';
import { validateSessionToken, sessionCookieName } from '$lib/server/auth';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ cookies }: RequestEvent) {  // Remove 'request' parameter as it's not used
  const sessionToken = cookies.get(sessionCookieName);
  
  if (!sessionToken) {
    return json({ user: null });
  }
  
  try {
    const { user } = await validateSessionToken(sessionToken);
    
    if (!user) {
      return json({ user: null });
    }
    
    // Return user data without sensitive information
    return json({
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error validating session:', error);
    return json({ user: null });
  }
}