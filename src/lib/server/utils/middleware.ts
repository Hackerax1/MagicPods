import type { RequestEvent } from '@sveltejs/kit';
import { validateToken } from '$lib/server/auth';
import { standardRateLimit } from './security/rateLimit';
import { errorResponse, ApiErrors } from './apiResponse';

export type MiddlewareContext = {
  user: {
    id: string;
    [key: string]: any;
  };
};

export async function withAuth(
  event: RequestEvent,
  handler: (event: RequestEvent, context: MiddlewareContext) => Promise<Response>
): Promise<Response> {
  try {
    // Apply rate limiting first
    await standardRateLimit(event);

    // Validate authentication
    const user = await validateToken(event);
    if (!user) {
      return errorResponse(ApiErrors.UNAUTHORIZED, 401);
    }

    // Call the handler with authenticated user context
    return handler(event, { user });
  } catch (error) {
    return errorResponse(error instanceof Error ? error : ApiErrors.SERVER_ERROR, 500);
  }
}