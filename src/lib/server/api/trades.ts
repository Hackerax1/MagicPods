import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '../db';
import { trade, tradeParticipant, tradeItem, userCard, tradeNotification } from '../db/schema';
import { validateToken } from '../auth';
import { successResponse, errorResponse, ApiErrors } from '../utils/apiResponse';
import { sanitizeString } from '../utils/security/sanitize';
import { standardRateLimit } from '../utils/security/rateLimit';
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
    await standardRateLimit(event);
    const user = await validateToken(event);
    if (!user) return errorResponse(ApiErrors.UNAUTHORIZED, 401);

    const path = event.url.pathname;
    const tradeId = path.split('/')[2];

    if (path.endsWith('/create')) {
      const body = await event.request.json() as CreateTradeBody;
      
      if (!body.podId || !body.participants?.length || !body.items?.length) {
        return errorResponse('Missing required fields', 400);
      }

      // Create the trade and add all related data in a transaction
      const result = await db.transaction(async (tx) => {
        // Create trade
        const [newTrade] = await tx.insert(trade).values({
          id: uuidv4(),
          podId: body.podId,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();

        // Add participants
        const uniqueParticipants = [...new Set([user.id, ...body.participants])];
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
        for (const item of body.items) {
          const [userCardDetails] = await tx
            .select()
            .from(userCard)
            .where(eq(userCard.id, item.userCardId));
          
          if (!userCardDetails || userCardDetails.userId !== user.id) {
            throw new Error('Card not found or not owned by user');
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

      return successResponse(result);
    }

    if (tradeId) {
      const [existingTrade] = await db
        .select()
        .from(trade)
        .where(eq(trade.id, tradeId));

      if (!existingTrade) return errorResponse(ApiErrors.NOT_FOUND, 404);

      // Check if user is a participant
      const [participant] = await db
        .select()
        .from(tradeParticipant)
        .where(and(
          eq(tradeParticipant.tradeId, tradeId),
          eq(tradeParticipant.userId, user.id)
        ));

      if (!participant) return errorResponse(ApiErrors.FORBIDDEN, 403);

      if (path.includes('/status')) {
        const body = await event.request.json() as UpdateTradeStatusBody;
        const newStatus = sanitizeString(body.status);
        
        if (!['pending', 'accepted', 'rejected', 'completed', 'cancelled'].includes(newStatus)) {
          return errorResponse('Invalid trade status', 400);
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

        return successResponse(result);
      }

      // Existing endpoints for participants and items...
      if (path.includes('/participants')) {
        const body = await event.request.json() as AddParticipantBody;
        if (!body.userId) {
          return errorResponse('User ID is required', 400);
        }

        const result = await db.transaction(async (tx) => {
          // Check if user is already a participant
          const [existingParticipant] = await tx
            .select()
            .from(tradeParticipant)
            .where(and(
              eq(tradeParticipant.tradeId, tradeId),
              eq(tradeParticipant.userId, body.userId)
            ));

          if (existingParticipant) {
            throw new Error('User is already a participant in this trade');
          }

          const [newParticipant] = await tx.insert(tradeParticipant).values({
            id: uuidv4(),
            tradeId,
            userId: body.userId
          }).returning();

          await tx.insert(tradeNotification).values({
            id: uuidv4(),
            tradeId,
            userId: body.userId,
            message: `You have been added to a trade by ${user.username}`,
            createdAt: new Date()
          });

          return { participant: newParticipant };
        });

        return successResponse(result);
      }

      if (path.includes('/items')) {
        const body = await event.request.json() as AddItemBody;
        if (!body.userCardId || typeof body.quantity !== 'number' || body.quantity <= 0) {
          return errorResponse('Invalid item details', 400);
        }

        const result = await db.transaction(async (tx) => {
          // Verify user owns the card
          const [userCardDetails] = await tx
            .select()
            .from(userCard)
            .where(eq(userCard.id, body.userCardId));
          
          if (!userCardDetails || userCardDetails.userId !== user.id) {
            throw new Error('Card not found or not owned by user');
          }

          const [newItem] = await tx.insert(tradeItem).values({
            id: uuidv4(),
            tradeId,
            userCardId: body.userCardId,
            quantity: body.quantity
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

        return successResponse(result);
      }
    }

    return errorResponse('Invalid endpoint', 404);
  } catch (error) {
    return errorResponse(error instanceof Error ? error : ApiErrors.SERVER_ERROR, 500);
  }
}

export async function GET(event: RequestEvent) {
  try {
    await standardRateLimit(event);
    const user = await validateToken(event);
    if (!user) return errorResponse(ApiErrors.UNAUTHORIZED, 401);

    const path = event.url.pathname;
    const tradeId = event.url.searchParams.get('tradeId');

    if (path.endsWith('/notifications')) {
      const notifications = await db
        .select()
        .from(tradeNotification)
        .where(eq(tradeNotification.userId, user.id))
        .orderBy(desc(tradeNotification.createdAt));

      return successResponse({ notifications });
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

      return successResponse({ trades });
    }

    if (tradeId) {
      // Existing trade details endpoint...
      const [tradeDetails] = await db
        .select()
        .from(trade)
        .where(eq(trade.id, tradeId));

      if (!tradeDetails) {
        return errorResponse(ApiErrors.NOT_FOUND, 404);
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
        return errorResponse(ApiErrors.FORBIDDEN, 403);
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

      return successResponse({ 
        trade: tradeDetails,
        participants,
        items
      });
    }

    return errorResponse('Invalid endpoint', 404);
  } catch (error) {
    return errorResponse(error instanceof Error ? error : ApiErrors.SERVER_ERROR, 500);
  }
}