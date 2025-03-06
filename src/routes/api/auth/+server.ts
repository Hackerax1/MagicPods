import type { RequestEvent } from '@sveltejs/kit';
import { successResponse, errorResponse } from '$lib/server/utils/apiResponse';
import { standardRateLimit } from '$lib/server/utils/security/rateLimit';
import { register, login, logout, validateToken } from '$lib/server/auth';
import { sanitizeString } from '$lib/server/utils/security/sanitize';

export async function POST(event: RequestEvent) {
  try {
    await standardRateLimit(event);
    
    const { action, email, username, password, identifier } = await event.request.json();

    if (!action || (action !== 'register' && action !== 'login' && action !== 'logout')) {
      return errorResponse('Invalid action', 400);
    }

    if (action === 'register') {
      if (!email || !username || !password) {
        return errorResponse('Email, username, and password are required', 400);
      }

      const sanitizedEmail = sanitizeString(email);
      const sanitizedUsername = sanitizeString(username);
      const result = await register(sanitizedEmail, sanitizedUsername, password);
      
      return successResponse({ user: result });
    }

    if (action === 'login') {
      if (!identifier || !password) {
        return errorResponse('Identifier and password are required', 400);
      }

      const sanitizedIdentifier = sanitizeString(identifier);
      const result = await login(sanitizedIdentifier, password, event);
      
      return successResponse(result);
    }

    if (action === 'logout') {
      await logout(event);
      return successResponse({ success: true });
    }
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Server error', 500);
  }
}

export async function GET(event: RequestEvent) {
  try {
    await standardRateLimit(event);
    const user = await validateToken(event);
    return successResponse({ user });
  } catch (error) {
    return successResponse({ user: null });
  }
}