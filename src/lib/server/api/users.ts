import { register, login } from '$lib/server/auth';
import { successResponse, errorResponse, ApiErrors } from '$lib/server/utils/apiResponse';
import { standardRateLimit } from '$lib/server/utils/security/rateLimit';
import { sanitizeString } from '$lib/server/utils/security/sanitize';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
  try {
    // Apply rate limiting
    await standardRateLimit(request);

    const { action, email, username, password, identifier } = await request.json();

    // Input validation and sanitization
    if (!action || (action !== 'register' && action !== 'login')) {
      return errorResponse(ApiErrors.INVALID_INPUT, 400);
    }

    if (action === 'register') {
      if (!email || !username || !password) {
        return errorResponse('Email, username, and password are required', 400);
      }

      // Sanitize inputs
      const sanitizedEmail = sanitizeString(email);
      const sanitizedUsername = sanitizeString(username);

      const newUser = await register(sanitizedEmail, sanitizedUsername, password);
      return successResponse({ user: newUser });
    } 
    
    if (action === 'login') {
      if (!identifier || !password) {
        return errorResponse('Identifier and password are required', 400);
      }

      const sanitizedIdentifier = sanitizeString(identifier);
      const result = await login(sanitizedIdentifier, password, { request });
      return successResponse(result);
    }
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error, 500);
    }
    return errorResponse(ApiErrors.SERVER_ERROR, 500);
  }
}