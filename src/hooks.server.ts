import type { Handle } from '@sveltejs/kit';
import { validateToken, AUTH_COOKIE_NAME } from '$lib/server/auth';

export const handle = async ({ event, resolve }) => {
  try {
    const token = event.cookies.get(AUTH_COOKIE_NAME);
    
    if (token) {
      const user = validateToken(token);
      if (user) {
        event.locals.user = {
          id: user.userId,
          username: user.username,
          email: user.email
        };
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
  }
  
  return resolve(event);
};
