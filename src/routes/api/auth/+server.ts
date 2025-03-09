import type { RequestEvent } from '@sveltejs/kit';
import { successResponse, errorResponse } from '$lib/server/utils/apiResponse';
import { standardRateLimit } from '$lib/server/utils/security/rateLimit';
import { register, login, logout, validateToken } from '$lib/server/auth';
import { sanitizeString } from '$lib/server/utils/security/sanitize';
import { generateResetToken, sendResetEmail } from '$lib/server/utils/security/email';
import { validatePassword } from '$lib/server/utils/security/password';

export async function POST(event: RequestEvent) {
  try {
    await standardRateLimit(event);
    
    const { action, email, username, password, identifier } = await event.request.json();

    if (!action || (action !== 'register' && action !== 'login' && action !== 'logout' && action !== 'forgotPassword')) {
      return errorResponse('Invalid action', 400);
    }

    if (action === 'register') {
      if (!email || !username || !password) {
        return errorResponse('Email, username, and password are required', 400);
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return errorResponse(passwordValidation.message, 400);
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

    if (action === 'forgotPassword') {
      return _forgotPassword(event);
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

export async function _forgotPassword(event: RequestEvent) {
  try {
    const { email } = await event.request.json();
    if (!email) {
      return errorResponse('Email is required', 400);
    }

    // Generate a password reset token and send it via email
    const resetToken = generateResetToken(email);
    await sendResetEmail(email, resetToken);

    return successResponse({ message: 'Password reset email sent' });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Server error', 500);
  }
}