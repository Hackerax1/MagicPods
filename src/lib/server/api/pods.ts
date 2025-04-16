import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { pod, podMembership } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { validateToken } from '../auth';
import { successResponse } from '../utils/apiResponse';
import { standardRateLimit } from '../utils/security/rateLimit';
import { sanitizeString } from '../utils/security/sanitize';
import { validateApiVersion } from '../utils/apiVersion';
import { compressResponse, decompressRequest } from '../utils/compression';
import { handleApiError, ApiError, ErrorCodes } from '../utils/errorHandler';

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

    if (!action || (action !== 'createPod' && action !== 'addUserToPod' && action !== 'removeUserFromPod' && action !== 'updatePodName')) {
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

      const result = await db.transaction(async (tx: any) => {
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

    } else if (action === 'removeUserFromPod') {
      const { podId, userId: removeUserId } = body as any;
      if (!podId || !removeUserId) {
        throw new ApiError('Pod ID and user ID are required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
      }
      // Verify pod exists
      const [podDetails] = await db.select().from(pod).where(eq(pod.id, podId));
      if (!podDetails) throw new ApiError('Pod not found', 404, ErrorCodes.NOT_FOUND);
      const isOwner = podDetails.userId === user.id;
      const isSelf = removeUserId === user.id;
      if (!isSelf && !isOwner) throw new ApiError('Access forbidden', 403, ErrorCodes.FORBIDDEN);
      // Get current members
      const podUsers = await db.select().from(podMembership).where(eq(podMembership.podId, podId));
      // Perform removal and contingency in a transaction
      await db.transaction(async (tx: any) => {
        await tx.delete(podMembership)
          .where(and(eq(podMembership.podId, podId), eq(podMembership.userId, removeUserId)));
        // If owner is leaving, transfer or delete pod
        if (removeUserId === podDetails.userId) {
          const remaining = podUsers.filter((p: any) => p.userId !== removeUserId);
          if (remaining.length > 0) {
            await tx.update(pod)
              .set({ userId: remaining[0].userId })
              .where(eq(pod.id, podId));
          } else {
            await tx.delete(pod).where(eq(pod.id, podId));
          }
        }
      });
      const response = successResponse({ success: true }, undefined, version);
      return compressResponse(response, event);

    } else if (action === 'updatePodName') {
      const { podId, podName: newName } = body as any;
      if (!podId || !newName) {
        throw new ApiError('Pod ID and new name are required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
      }
      const sanitized = sanitizeString(newName);
      const [podDetails] = await db.select().from(pod).where(eq(pod.id, podId));
      if (!podDetails) throw new ApiError('Pod not found', 404, ErrorCodes.NOT_FOUND);
      if (podDetails.userId !== user.id) throw new ApiError('Access forbidden', 403, ErrorCodes.FORBIDDEN);
      await db.update(pod).set({ name: sanitized }).where(eq(pod.id, podId));
      const response = successResponse({ success: true, name: sanitized }, undefined, version);
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

    const isUserInPod = podUsers.some((pu: any) => pu.userId === user.id);
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