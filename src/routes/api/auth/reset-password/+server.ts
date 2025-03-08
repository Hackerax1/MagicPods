import type { RequestEvent } from '@sveltejs/kit';
import { successResponse, errorResponse } from '$lib/server/utils/apiResponse';
import { standardRateLimit } from '$lib/server/utils/security/rateLimit';
import { sanitizeString } from '$lib/server/utils/security/sanitize';
import { verifyResetToken, updateUserPassword } from '$lib/server/utils/security/passwordReset';

export async function POST(event: RequestEvent) {
  try {
    await standardRateLimit(event);
    
    const { token, newPassword } = await event.request.json();

    if (!token || !newPassword) {
      return errorResponse('Token and new password are required', 400);
    }

    // Validate password
    if (newPassword.length < 8) {
      return errorResponse('Password must be at least 8 characters long', 400);
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
