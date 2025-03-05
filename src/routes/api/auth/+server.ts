import { json } from '@sveltejs/kit';
import { register, login, logout, validateToken } from '$lib/server/auth';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Consolidated authentication API endpoint.
 * Handles login, register, me (current user), and logout actions via POST requests
 * with an 'action' parameter.
 */
export async function POST(event: RequestEvent) {
  const { request } = event;
  const data = await request.json();
  const { action } = data;

  try {
    switch (action) {
      case 'login':
        const { identifier, password } = data;
        if (!identifier || !password) {
          return json({ 
            success: false, 
            error: 'Missing credentials' 
          }, { status: 400 });
        }
        
        const loginResult = await login(identifier, password, event);
        return json(loginResult);

      case 'register':
        const { email, username, password: registerPassword } = data;
        if (!email || !username || !registerPassword) {
          return json({ 
            success: false, 
            error: 'Missing required fields' 
          }, { status: 400 });
        }
        
        const registerResult = await register(email, username, registerPassword);
        return json({
          success: true,
          user: registerResult
        });

      case 'logout':
        await logout(event);
        return json({ success: true });

      case 'me':
        const user = await validateToken(event);
        return json({ user });

      default:
        return json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error(`Auth error (${action}):`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('not found') || errorMessage.includes('invalid') ? 401 : 500;
    
    return json({ 
      success: false, 
      error: errorMessage 
    }, { status: statusCode });
  }
}

/**
 * GET handler specifically for retrieving the current user session
 * (equivalent to the 'me' action in the POST handler)
 */
export async function GET(event: RequestEvent) {
  try {
    const user = await validateToken(event);
    return json({ user });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return json({ user: null });
  }
}