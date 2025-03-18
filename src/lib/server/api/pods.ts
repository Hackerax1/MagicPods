import { db } from '$lib/server/db';
import { v4 as uuidv4 } from 'uuid';
import { pod, podMembership } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { validateToken } from '$lib/server/auth';
import { successResponse } from '$lib/server/utils/apiResponse';
import { standardRateLimit } from '$lib/server/utils/security/rateLimit';
import { sanitizeString } from '$lib/server/utils/security/sanitize';
import { validateApiVersion } from '$lib/server/utils/apiVersion';
import { compressResponse, decompressRequest } from '$lib/server/utils/compression';
import { handleApiError, ApiError, ErrorCodes } from '$lib/server/utils/errorHandler';

import type { RequestEvent } from '@sveltejs/kit';

export async function POST(event: RequestEvent) {
  try {
    // Apply rate limiting
    await standardRateLimit(event);

    // Validate API version
    const { error, version } = await validateApiVersion(event);
    if (error) return error;

    // Validate authentication
    const user = await validateToken(event);
    if (!user) {
      throw new ApiError('Authentication required', 401, ErrorCodes.UNAUTHORIZED);
    }

    // Parse request with compression support
    const body = await decompressRequest(event).catch(() => {
      throw new ApiError('Invalid request format', 400, ErrorCodes.INVALID_FORMAT);
    });

    const { action, podName, podId, newUserId } = body as any;

    if (!action || (action !== 'createPod' && action !== 'addUserToPod')) {
      throw new ApiError('Invalid action', 400, ErrorCodes.INVALID_INPUT);
    }

    if (action === 'createPod') {
      if (!podName) {
        throw new ApiError('Pod name is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
      }

      const sanitizedName = sanitizeString(podName);
      const newPod = {
        id: uuidv4(),
        name: sanitizedName,
        userId: user.id
      };

      const result = await db.transaction(async (tx) => {
        const [newPodResult] = await tx.insert(pod).values(newPod).returning();
        await tx.insert(podMembership).values({ 
          id: uuidv4(), 
          podId: newPod.id, 
          userId: user.id 
        });
        return newPodResult;
      });

      const response = successResponse({ pod: result }, undefined, version);
      return compressResponse(response, event);

    } else if (action === 'addUserToPod') {
      if (!podId || !newUserId) {
        throw new ApiError('Pod ID and user ID are required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
      }

      // Verify pod exists and user has permission
      const [podDetails] = await db
        .select()
        .from(pod)
        .where(eq(pod.id, podId));

      if (!podDetails) {
        throw new ApiError('Pod not found', 404, ErrorCodes.NOT_FOUND);
      }

      // Check if user is pod owner
      if (podDetails.userId !== user.id) {
        throw new ApiError('Access forbidden', 403, ErrorCodes.FORBIDDEN);
      }

      // Check if user is already in pod
      const [existingMembership] = await db
        .select()
        .from(podMembership)
        .where(and(eq(podMembership.podId, podId), eq(podMembership.userId, newUserId)));

      if (existingMembership) {
        throw new ApiError('User is already a member of this pod', 400, ErrorCodes.INVALID_INPUT);
      }

      await db.insert(podMembership).values({ 
        id: uuidv4(), 
        podId, 
        userId: newUserId 
      });

      const response = successResponse({ success: true }, undefined, version);
      return compressResponse(response, event);
    }
    
    throw new ApiError('Invalid action', 400, ErrorCodes.INVALID_INPUT);
  } catch (error) {
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

    // Validate authentication
    const user = await validateToken(event);
    if (!user) {
      throw new ApiError('Authentication required', 401, ErrorCodes.UNAUTHORIZED);
    }

    const podId = event.url.searchParams.get('podId');
    if (!podId) {
      throw new ApiError('Pod ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    const [podDetails] = await db
      .select()
      .from(pod)
      .where(eq(pod.id, podId));

    if (!podDetails) {
      throw new ApiError('Pod not found', 404, ErrorCodes.NOT_FOUND);
    }

    const podUsers = await db
      .select()
      .from(podMembership)
      .where(eq(podMembership.podId, podId));

    const isUserInPod = podUsers.some(pu => pu.userId === user.id);
    if (!isUserInPod) {
      throw new ApiError('Access forbidden', 403, ErrorCodes.FORBIDDEN);
    }

    const response = successResponse({ 
      pod: podDetails, 
      users: podUsers 
    }, undefined, version);
    
    return compressResponse(response, event);
  } catch (error) {
    return handleApiError(error, event);
  }
}