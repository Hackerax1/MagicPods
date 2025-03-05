import { json } from '@sveltejs/kit';
import { register, login, logout, validateToken } from '$lib/server/auth';
import type { RequestEvent } from '@sveltejs/kit';
import { sanitizeObject, validateAndSanitizeEmail, validateAndSanitizeUsername } from '$lib/server/utils/security/sanitize';
import { authRateLimit, standardRateLimit } from '$lib/server/utils/security/rateLimit';

/**
 * Consolidated authentication API endpoint.
 * Handles login, register, me (current user), and logout actions via POST requests
 * with an 'action' parameter.
 */
export async function POST(event: RequestEvent) {
  const { request } = event;
  
  // Apply rate limiting first to prevent abuse
  await authRateLimit(event);
  
  // Parse and sanitize request data
  const rawData = await request.json();
  const data = sanitizeObject(rawData);
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
        
        // Sanitized identifier (could be email or username)
        const sanitizedIdentifier = identifier.toString().trim();
        
        const loginResult = await login(sanitizedIdentifier, password, event);
        return json(loginResult);

      case 'register':
        const { email, username, password: registerPassword } = data;
        
        // Validate and sanitize inputs
        const sanitizedEmail = validateAndSanitizeEmail(email);
        const sanitizedUsername = validateAndSanitizeUsername(username);

        if (!sanitizedEmail) {
          return json({ success: false, error: 'Invalid email address' }, { status: 400 });
        }
        
        if (!sanitizedUsername) {
          return json({ success: false, error: 'Invalid username. Use 3-20 alphanumeric characters and underscores only.' }, { status: 400 });
        }
        
        if (!registerPassword) {
          return json({ success: false, error: 'Password is required' }, { status: 400 });
        }
        
        const registerResult = await register(sanitizedEmail, sanitizedUsername, registerPassword);
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
  // Apply standard rate limit for session checks
  await standardRateLimit(event);
  
  try {
    const user = await validateToken(event);
    return json({ user });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return json({ user: null });
  }
}