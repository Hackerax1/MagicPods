import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { pod, podMembership, user } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { validateToken } from '$lib/server/auth';
import { successResponse } from '$lib/server/utils/apiResponse';
import { standardRateLimit } from '$lib/server/utils/security/rateLimit';
import { validateApiVersion } from '$lib/server/utils/apiVersion';
import { compressResponse } from '$lib/server/utils/compression';
import { handleApiError, ApiError, ErrorCodes } from '$lib/server/utils/errorHandler';

export async function GET(event: RequestEvent) {
    try {
        // Apply rate limiting
        await standardRateLimit(event);

        // Validate API version
        const { error, version } = await validateApiVersion(event);
        if (error) return error;

        // Validate authentication
        const currentUser = await validateToken(event);
        if (!currentUser) {
            throw new ApiError('Authentication required', 401, ErrorCodes.UNAUTHORIZED);
        }

        const podId = event.params.podId;
        if (!podId) {
            throw new ApiError('Pod ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
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
            throw new ApiError('Access forbidden', 403, ErrorCodes.FORBIDDEN);
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

        const response = successResponse({ members }, undefined, version);
        return compressResponse(response, event);
    } catch (error) {
        return handleApiError(error, event);
    }
}