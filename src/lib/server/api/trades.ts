import type { RequestEvent } from '@sveltejs/kit';
import { db } from '../db';
import { trade, tradeParticipant, tradeItem, userCard, tradeNotification } from '../db/schema';
import { validateToken } from '../auth';
import { successResponse } from '../utils/apiResponse';
import { sanitizeString } from '../utils/security/sanitize';
import { standardRateLimit } from '../utils/security/rateLimit';
import { validateApiVersion } from '../utils/apiVersion';
import { compressResponse, decompressRequest } from '../utils/compression';
import { handleApiError, ApiError, ErrorCodes } from '../utils/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc, inArray } from 'drizzle-orm';

// Type definitions for request bodies
interface CreateTradeBody {
  podId: string;
  participants: string[];
  items: Array<{
    userCardId: string;
    quantity: number;
  }>;
}

interface UpdateTradeStatusBody {
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
}

interface AddParticipantBody {
  userId: string;
}

interface AddItemBody {
  userCardId: string;
  quantity: number;
}

async function createTradeNotification(tradeId: string, userId: string, message: string) {
  await db.insert(tradeNotification).values({
    id: uuidv4(),
    tradeId,
    userId,
    message,
    createdAt: new Date()
  });
}

export async function POST(event: RequestEvent) {
  try {
    // Apply rate limiting
    await standardRateLimit(event);
    
    // Validate API version
    const { error, version } = await validateApiVersion(event);
    if (error) return error;
    
    // Authenticate user
    const user = await validateToken(event);
    if (!user) {
      throw new ApiError('Authentication required', 401, ErrorCodes.UNAUTHORIZED);
    }

    // Parse request with compression support
    const body = await decompressRequest(event).catch(() => {
      throw new ApiError('Invalid request format', 400, ErrorCodes.INVALID_FORMAT);
    });
    
    const path = event.url.pathname;
    const tradeId = path.split('/')[2];

    if (path.endsWith('/create')) {
      const createBody = body as CreateTradeBody;
      
      if (!createBody.podId || !createBody.participants?.length || !createBody.items?.length) {
        throw new ApiError('Missing required fields', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
      }

      // Create the trade and add all related data in a transaction
      const result = await db.transaction(async (tx) => {
        // Create trade
        const [newTrade] = await tx.insert(trade).values({
          id: uuidv4(),
          podId: createBody.podId,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();

        // Add participants
        const uniqueParticipants = [...new Set([user.id, ...createBody.participants])];
        await Promise.all(uniqueParticipants.map(async (userId) => {
          await tx.insert(tradeParticipant).values({
            id: uuidv4(),
            tradeId: newTrade.id,
            userId
          });

          if (userId !== user.id) {
            await tx.insert(tradeNotification).values({
              id: uuidv4(),
              tradeId: newTrade.id,
              userId,
              message: `You've been invited to a new trade by ${user.username}`,
              createdAt: new Date()
            });
          }
        }));

        // Verify and add items
        for (const item of createBody.items) {
          const [userCardDetails] = await tx
            .select()
            .from(userCard)
            .where(eq(userCard.id, item.userCardId));
          
          if (!userCardDetails || userCardDetails.userId !== user.id) {
            throw new ApiError('Card not found or not owned by user', 400, ErrorCodes.INVALID_INPUT);
          }

          await tx.insert(tradeItem).values({
            id: uuidv4(),
            tradeId: newTrade.id,
            userCardId: item.userCardId,
            quantity: item.quantity
          });
        }

        return { trade: newTrade };
      });

      const response = successResponse(result, undefined, version);
      return compressResponse(response, event);
    }

    if (tradeId) {
      const [existingTrade] = await db
        .select()
        .from(trade)
        .where(eq(trade.id, tradeId));

      if (!existingTrade) {
        throw new ApiError('Trade not found', 404, ErrorCodes.NOT_FOUND);
      }

      // Check if user is a participant
      const [participant] = await db
        .select()
        .from(tradeParticipant)
        .where(and(
          eq(tradeParticipant.tradeId, tradeId),
          eq(tradeParticipant.userId, user.id)
        ));

      if (!participant) {
        throw new ApiError('Access forbidden', 403, ErrorCodes.FORBIDDEN);
      }

      if (path.includes('/status')) {
        const statusBody = body as UpdateTradeStatusBody;
        const newStatus = sanitizeString(statusBody.status);
        
        if (!['pending', 'accepted', 'rejected', 'completed', 'cancelled'].includes(newStatus)) {
          throw new ApiError('Invalid trade status', 400, ErrorCodes.INVALID_INPUT);
        }

        // Get all participants and update trade status in a transaction
        const result = await db.transaction(async (tx) => {
          const participants = await tx
            .select()
            .from(tradeParticipant)
            .where(eq(tradeParticipant.tradeId, tradeId));

          const [updatedTrade] = await tx
            .update(trade)
            .set({ 
              status: newStatus,
              updatedAt: new Date()
            })
            .where(eq(trade.id, tradeId))
            .returning();

          // Create notifications within the same transaction
          await Promise.all(participants.map(async (p) => {
            if (p.userId !== user.id) {
              await tx.insert(tradeNotification).values({
                id: uuidv4(),
                tradeId,
                userId: p.userId,
                message: `Trade status updated to ${newStatus} by ${user.username}`,
                createdAt: new Date()
              });
            }
          }));

          return { trade: updatedTrade, participants };
        });

        const response = successResponse(result, undefined, version);
        return compressResponse(response, event);
      }

      // Handle participants endpoint
      if (path.includes('/participants')) {
        const participantBody = body as AddParticipantBody;
        if (!participantBody.userId) {
          throw new ApiError('User ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
        }

        const result = await db.transaction(async (tx) => {
          // Check if user is already a participant
          const [existingParticipant] = await tx
            .select()
            .from(tradeParticipant)
            .where(and(
              eq(tradeParticipant.tradeId, tradeId),
              eq(tradeParticipant.userId, participantBody.userId)
            ));

          if (existingParticipant) {
            throw new ApiError('User is already a participant in this trade', 400, ErrorCodes.INVALID_INPUT);
          }

          const [newParticipant] = await tx.insert(tradeParticipant).values({
            id: uuidv4(),
            tradeId,
            userId: participantBody.userId
          }).returning();

          await tx.insert(tradeNotification).values({
            id: uuidv4(),
            tradeId,
            userId: participantBody.userId,
            message: `You have been added to a trade by ${user.username}`,
            createdAt: new Date()
          });

          return { participant: newParticipant };
        });

        const response = successResponse(result, undefined, version);
        return compressResponse(response, event);
      }

      if (path.includes('/items')) {
        const itemBody = body as AddItemBody;
        if (!itemBody.userCardId || typeof itemBody.quantity !== 'number' || itemBody.quantity <= 0) {
          throw new ApiError('Invalid item details', 400, ErrorCodes.INVALID_INPUT);
        }

        const result = await db.transaction(async (tx) => {
          // Verify user owns the card
          const [userCardDetails] = await tx
            .select()
            .from(userCard)
            .where(eq(userCard.id, itemBody.userCardId));
          
          if (!userCardDetails || userCardDetails.userId !== user.id) {
            throw new ApiError('Card not found or not owned by user', 400, ErrorCodes.INVALID_INPUT);
          }

          const [newItem] = await tx.insert(tradeItem).values({
            id: uuidv4(),
            tradeId,
            userCardId: itemBody.userCardId,
            quantity: itemBody.quantity
          }).returning();

          // Notify other participants
          const participants = await tx
            .select()
            .from(tradeParticipant)
            .where(eq(tradeParticipant.tradeId, tradeId));

          await Promise.all(participants.map(async (p) => {
            if (p.userId !== user.id) {
              await tx.insert(tradeNotification).values({
                id: uuidv4(),
                tradeId,
                userId: p.userId,
                message: `${user.username} added a card to the trade`,
                createdAt: new Date()
              });
            }
          }));

          return { item: newItem };
        });

        const response = successResponse(result, undefined, version);
        return compressResponse(response, event);
      }
    }

    throw new ApiError('Invalid endpoint', 404, ErrorCodes.NOT_FOUND);
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
    
    // Authenticate user
    const user = await validateToken(event);
    if (!user) {
      throw new ApiError('Authentication required', 401, ErrorCodes.UNAUTHORIZED);
    }

    const path = event.url.pathname;
    const tradeId = event.url.searchParams.get('tradeId');

    if (path.endsWith('/notifications')) {
      const notifications = await db
        .select()
        .from(tradeNotification)
        .where(eq(tradeNotification.userId, user.id))
        .orderBy(desc(tradeNotification.createdAt));

      const response = successResponse({ notifications }, undefined, version);
      return compressResponse(response, event);
    }

    if (path.endsWith('/history')) {
      const userTrades = await db
        .select()
        .from(tradeParticipant)
        .where(eq(tradeParticipant.userId, user.id));

      const tradeIds = userTrades.map(t => t.tradeId);
      
      const trades = await db
        .select()
        .from(trade)
        .where(inArray(trade.id, tradeIds))
        .orderBy(desc(trade.updatedAt));

      const response = successResponse({ trades }, undefined, version);
      return compressResponse(response, event);
    }

    if (tradeId) {
      const [tradeDetails] = await db
        .select()
        .from(trade)
        .where(eq(trade.id, tradeId));

      if (!tradeDetails) {
        throw new ApiError('Trade not found', 404, ErrorCodes.NOT_FOUND);
      }

      // Check if user is a participant
      const [participant] = await db
        .select()
        .from(tradeParticipant)
        .where(and(
          eq(tradeParticipant.tradeId, tradeId),
          eq(tradeParticipant.userId, user.id)
        ));

      if (!participant) {
        throw new ApiError('Access forbidden', 403, ErrorCodes.FORBIDDEN);
      }

      // Get all participants and items
      const participants = await db
        .select()
        .from(tradeParticipant)
        .where(eq(tradeParticipant.tradeId, tradeId));

      const items = await db
        .select()
        .from(tradeItem)
        .where(eq(tradeItem.tradeId, tradeId));

      const response = successResponse({ 
        trade: tradeDetails,
        participants,
        items
      }, undefined, version);
      return compressResponse(response, event);
    }

    throw new ApiError('Invalid endpoint', 404, ErrorCodes.NOT_FOUND);
  } catch (error) {
    return handleApiError(error, event);
  }
}