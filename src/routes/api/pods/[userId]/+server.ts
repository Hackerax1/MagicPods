import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { pod, podMembership } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { validateToken } from '$lib/server/auth';
import { successResponse, errorResponse, ApiErrors } from '$lib/server/utils/apiResponse';
import { standardRateLimit } from '$lib/server/utils/security/rateLimit';

export async function GET(event: RequestEvent) {
    try {
        // Apply rate limiting
        await standardRateLimit(event);

        // Validate authentication
        const user = await validateToken(event);
        if (!user) {
            return errorResponse(ApiErrors.UNAUTHORIZED, 401);
        }

        const userId = event.params.userId;
        if (!userId) {
            return errorResponse('User ID is required', 400);
        }
        
        // Get all pods where the user is a member
        const userPods = await db
            .select({
                id: pod.id,
                name: pod.name,
                userId: pod.userId
            })
            .from(pod)
            .innerJoin(
                podMembership,
                eq(pod.id, podMembership.podId)
            )
            .where(eq(podMembership.userId, userId as string));

        return successResponse({ pods: userPods });
    } catch (error) {
        return errorResponse(error instanceof Error ? error : ApiErrors.SERVER_ERROR, 500);
    }
}