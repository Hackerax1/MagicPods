import type { RequestEvent } from '@sveltejs/kit';
import { successResponse, errorResponse } from '$lib/server/utils/apiResponse';
import { standardRateLimit } from '$lib/server/utils/security/rateLimit';
import { sanitizeString } from '$lib/server/utils/security/sanitize';
import { verifyResetToken, updateUserPassword } from '$lib/server/utils/security/passwordReset';
import { validatePassword } from '$lib/server/utils/security/password';

export async function POST(event: RequestEvent) {
  try {
    await standardRateLimit(event);
    
    const { token, newPassword } = await event.request.json();
    if (!token || !newPassword) {
      return errorResponse('Token and new password are required', 400);
    }

    // Use robust password validation
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return errorResponse(passwordValidation.message, 400);
    }
    
    // Verify the token and get the associated email
    const email = await verifyResetToken(token);
    
    if (!email) {
      return errorResponse('Invalid or expired token', 400);
    }
    // Update the user's password
    await updateUserPassword(email, newPassword);
    return successResponse({ message: 'Password successfully reset' });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Server error', 500);
  }
}
