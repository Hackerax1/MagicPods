import type { RequestEvent } from '@sveltejs/kit';
import { successResponse } from '$lib/server/utils/apiResponse';
import { standardRateLimit } from '$lib/server/utils/security/rateLimit';
import { register, login, logout, validateToken, AUTH_COOKIE_NAME } from '$lib/server/auth';
import { sanitizeString } from '$lib/server/utils/security/sanitize';
import { generateResetToken, sendResetEmail } from '$lib/server/utils/security/email';
import { validateApiVersion } from '$lib/server/utils/apiVersion';
import { compressResponse, decompressRequest } from '$lib/server/utils/compression';
import { handleApiError, ApiError, ErrorCodes } from '$lib/server/utils/errorHandler';

export async function POST(event: RequestEvent) {
  try {
    // Apply rate limiting
    await standardRateLimit(event);
    
    // Validate API version
    const { error, version } = await validateApiVersion(event);
    if (error) return error;
    
    // Parse request body (with compression support)
    const requestBody = await decompressRequest(event).catch(() => {
      throw new ApiError('Invalid request format', 400, ErrorCodes.INVALID_FORMAT);
    });
    
    // Type guard for the request body
    if (!requestBody || typeof requestBody !== 'object') {
      throw new ApiError('Invalid request body', 400, ErrorCodes.INVALID_INPUT);
    }

    const { action, email, username, password, identifier } = requestBody as any;

    if (!action || (action !== 'register' && action !== 'login' && action !== 'logout' && action !== 'forgotPassword')) {
      throw new ApiError('Invalid action', 400, ErrorCodes.INVALID_INPUT);
    }

    if (action === 'register') {
      if (!email || !username || !password) {
        throw new ApiError('Email, username, and password are required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
      }

      const sanitizedEmail = sanitizeString(email);
      const sanitizedUsername = sanitizeString(username);
      const result = await register(sanitizedEmail, sanitizedUsername, password);
      
      // Return success response with version
      const response = successResponse({ user: result }, undefined, version);
      return compressResponse(response, event);
    }

    if (action === 'login') {
      if (!identifier || !password) {
        throw new ApiError('Identifier and password are required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
      }

      const sanitizedIdentifier = sanitizeString(identifier);
      const result = await login(sanitizedIdentifier, password, event);
      
      // Return success response with version
      const response = successResponse(result, undefined, version);
      return compressResponse(response, event);
    }

    if (action === 'logout') {
      await logout(event);
      const response = successResponse({ success: true }, undefined, version);
      return compressResponse(response, event);
    }

    if (action === 'forgotPassword') {
      return _forgotPassword(event, version);
    }
  } catch (error) {
    // Use centralized error handler
    return handleApiError(error, event);
  }
}

export async function GET(event: RequestEvent) {
  try {
    // Apply rate limiting
    await standardRateLimit(event);
    
    // Validate API version
    const { error, version } = await validateApiVersion(event);
    if (error) return error;
    
    const token = event.cookies.get(AUTH_COOKIE_NAME);
    if (!token) {
      const response = successResponse({ user: null }, undefined, version);
      return compressResponse(response, event);
    }
    
    const user = validateToken(event);
    const response = successResponse({ user }, undefined, version);
    return compressResponse(response, event);
  } catch (error) {
    // For authentication endpoints, we often want to return null user instead of error
    const { error: versionError, version } = await validateApiVersion(event);
    if (versionError) return versionError;
    
    const response = successResponse({ user: null }, undefined, version);
    return compressResponse(response, event);
  }
}

export async function _forgotPassword(event: RequestEvent, version: ApiVersion | undefined) {
  try {
    const requestBody = await decompressRequest(event);
    const { email } = requestBody as any;
    
    if (!email) {
      throw new ApiError('Email is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    // Generate a password reset token and send it via email
    const resetToken = generateResetToken(email);
    await sendResetEmail(email, resetToken);

    const response = successResponse({ message: 'Password reset email sent' }, undefined, version);
    return compressResponse(response, event);
  } catch (error) {
    return handleApiError(error, event, version);
  }
}