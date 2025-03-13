import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { pod, podMembership, user } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { validateToken } from '$lib/server/auth';
import { successResponse, errorResponse, ApiErrors } from '$lib/server/utils/apiResponse';
import { standardRateLimit } from '$lib/server/utils/security/rateLimit';

export async function GET(event: RequestEvent) {
    try {
        // Apply rate limiting
        await standardRateLimit(event);

        // Validate authentication
        const currentUser = await validateToken(event);
        if (!currentUser) {
            return errorResponse(ApiErrors.UNAUTHORIZED, 401);
        }

        const podId = event.params.podId;
        if (!podId) {
            return errorResponse('Pod ID is required', 400);
        }

        // Check if current user is a member of the pod
        const memberships = await db
            .select()
            .from(podMembership)
            .where(and(
                eq(podMembership.podId, podId as string),
                eq(podMembership.userId, currentUser.userId)
            ));

        if (memberships.length === 0) {
            return errorResponse(ApiErrors.FORBIDDEN, 403);
        }

        // Get all members of the pod
        const members = await db
            .select({
                userId: user.id,
                username: user.username
            })
            .from(user)
            .innerJoin(
                podMembership,
                eq(user.id, podMembership.userId)
            )
            .where(eq(podMembership.podId, podId as string));

        return successResponse({ members });
    } catch (error) {
        return errorResponse(error instanceof Error ? error : ApiErrors.SERVER_ERROR, 500);
    }
}