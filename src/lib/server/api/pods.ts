import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { v4 as uuidv4 } from 'uuid';
import { pod, podMembership } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { validateToken } from '$lib/server/auth';
import { successResponse, errorResponse, ApiErrors } from '$lib/server/utils/apiResponse';
import { standardRateLimit } from '$lib/server/utils/security/rateLimit';
import { sanitizeString } from '$lib/server/utils/security/sanitize';

import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
  try {
    // Apply rate limiting
    await standardRateLimit(request);

    // Validate authentication
    const user = await validateToken(request);
    if (!user) {
      return errorResponse(ApiErrors.UNAUTHORIZED, 401);
    }

    const { action, podName, podId, newUserId } = await request.json();

    if (!action || (action !== 'createPod' && action !== 'addUserToPod')) {
      return errorResponse(ApiErrors.INVALID_INPUT, 400);
    }

    if (action === 'createPod') {
      if (!podName) {
        return errorResponse('Pod name is required', 400);
      }

      const sanitizedName = sanitizeString(podName);
      const newPod = {
        id: uuidv4(),
        name: sanitizedName,
        userId: user.id
      };

      await db.insert(pod).values(newPod);
      await db.insert(podMembership).values({ 
        id: uuidv4(), 
        podId: newPod.id, 
        userId: user.id 
      });

      return successResponse({ pod: newPod });

    } else if (action === 'addUserToPod') {
      if (!podId || !newUserId) {
        return errorResponse('Pod ID and user ID are required', 400);
      }

      // Verify pod exists and user has permission
      const [podDetails] = await db
        .select()
        .from(pod)
        .where(eq(pod.id, podId));

      if (!podDetails) {
        return errorResponse(ApiErrors.NOT_FOUND, 404);
      }

      // Check if user is pod owner
      if (podDetails.userId !== user.id) {
        return errorResponse(ApiErrors.FORBIDDEN, 403);
      }

      // Check if user is already in pod
      const [existingMembership] = await db
        .select()
        .from(podMembership)
        .where(eq(podMembership.podId, podId))
        .where(eq(podMembership.userId, newUserId));

      if (existingMembership) {
        return errorResponse('User is already a member of this pod', 400);
      }

      await db.insert(podMembership).values({ 
        id: uuidv4(), 
        podId, 
        userId: newUserId 
      });

      return successResponse({ success: true });
    }
  } catch (error) {
    return errorResponse(error instanceof Error ? error : ApiErrors.SERVER_ERROR, 500);
  }
}

export async function GET({ url, request }: RequestEvent) {
  try {
    // Apply rate limiting
    await standardRateLimit(request);

    // Validate authentication
    const user = await validateToken(request);
    if (!user) {
      return errorResponse(ApiErrors.UNAUTHORIZED, 401);
    }

    const podId = url.searchParams.get('podId');
    if (!podId) {
      return errorResponse('Pod ID is required', 400);
    }

    const [podDetails] = await db
      .select()
      .from(pod)
      .where(eq(pod.id, podId));

    if (!podDetails) {
      return errorResponse(ApiErrors.NOT_FOUND, 404);
    }

    const podUsers = await db
      .select()
      .from(podMembership)
      .where(eq(podMembership.podId, podId));

    const isUserInPod = podUsers.some(pu => pu.userId === user.id);
    if (!isUserInPod) {
      return errorResponse(ApiErrors.FORBIDDEN, 403);
    }

    return successResponse({ 
      pod: podDetails, 
      users: podUsers 
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error : ApiErrors.SERVER_ERROR, 500);
  }
}