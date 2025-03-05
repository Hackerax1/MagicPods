import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '../db';
import { trade, tradeParticipant, tradeItem, userCard } from '../db/schema';
import { validateToken } from '../auth';
import { sanitizeString } from '../utils/security/sanitize';
import { standardRateLimit } from '../utils/security/rateLimit';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

// Type definitions for request bodies
interface CreateTradeBody {
  podId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
}

interface AddParticipantBody {
  userId: string;
}

interface AddItemBody {
  userCardId: string;
  quantity: number;
}

export async function POST(event: RequestEvent) {
  try {
    // Apply rate limiting
    await standardRateLimit(event);

    // Validate authentication
    const user = await validateToken(event);
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const path = event.url.pathname;
    const tradeId = path.split('/')[2]; // Get tradeId from URL if present

    if (path.endsWith('/create')) {
      const body = await event.request.json() as CreateTradeBody;
      
      // Validate required fields
      if (!body.podId || !body.status) {
        return json({ success: false, error: 'Missing required fields' }, { status: 400 });
      }

      // Sanitize input
      const sanitizedStatus = sanitizeString(body.status);
      if (!['pending', 'accepted', 'rejected', 'completed'].includes(sanitizedStatus)) {
        return json({ success: false, error: 'Invalid status' }, { status: 400 });
      }

      const newTrade = await db.insert(trade).values({
        id: uuidv4(),
        podId: body.podId,
        status: sanitizedStatus,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      return json({ success: true, trade: newTrade[0] });
    }

    if (path.includes('/participants')) {
      // Validate trade exists
      const existingTrade = await db.select().from(trade).where(eq(trade.id, tradeId)).limit(1);
      if (!existingTrade.length) {
        return json({ success: false, error: 'Trade not found' }, { status: 404 });
      }

      const body = await event.request.json() as AddParticipantBody;
      if (!body.userId) {
        return json({ success: false, error: 'Missing userId' }, { status: 400 });
      }

      const newParticipant = await db.insert(tradeParticipant).values({
        id: uuidv4(),
        tradeId,
        userId: body.userId
      }).returning();

      return json({ success: true, participant: newParticipant[0] });
    }

    if (path.includes('/items')) {
      // Validate trade exists
      const existingTrade = await db.select().from(trade).where(eq(trade.id, tradeId)).limit(1);
      if (!existingTrade.length) {
        return json({ success: false, error: 'Trade not found' }, { status: 404 });
      }

      const body = await event.request.json() as AddItemBody;
      if (!body.userCardId || typeof body.quantity !== 'number' || body.quantity <= 0) {
        return json({ success: false, error: 'Invalid item details' }, { status: 400 });
      }

      // Verify user owns the card
      const userCards = await db.select()
        .from(userCard)
        .where(eq(userCard.id, body.userCardId))
        .limit(1);
      
      if (!userCards.length || userCards[0].userId !== user.id) {
        return json({ success: false, error: 'Card not found or not owned by user' }, { status: 403 });
      }

      const newItem = await db.insert(tradeItem).values({
        id: uuidv4(),
        tradeId,
        userCardId: body.userCardId,
        quantity: body.quantity
      }).returning();

      return json({ success: true, item: newItem[0] });
    }

    return json({ success: false, error: 'Invalid endpoint' }, { status: 404 });

  } catch (error) {
    console.error('Trade operation error:', error);
    return json({ 
      success: false, 
      error: 'An unexpected error occurred' 
    }, { status: 500 });
  }
}