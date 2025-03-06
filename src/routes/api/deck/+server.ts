import type { RequestEvent } from '@sveltejs/kit';
import { withAuth } from '$lib/server/utils/middleware';
import { successResponse, errorResponse } from '$lib/server/utils/apiResponse';
import { db } from '$lib/server/db';
import { deck } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sanitizeString } from '$lib/server/utils/security/sanitize';
import { v4 as uuidv4 } from 'uuid';

export async function POST(event: RequestEvent) {
  return withAuth(event, async (event, { user }) => {
    const { action, deckName, deckId, win, loss } = await event.request.json();

    if (!action || (action !== 'createDeck' && action !== 'updateDeck')) {
      return errorResponse('Invalid action', 400);
    }

    if (action === 'createDeck') {
      if (!deckName) {
        return errorResponse('Deck name is required', 400);
      }

      const sanitizedName = sanitizeString(deckName);
      const newDeck = {
        id: uuidv4(),
        name: sanitizedName,
        win: 0,
        loss: 0,
        userId: user.id
      };

      await db.insert(deck).values(newDeck);
      return successResponse({ deck: newDeck });
    }

    // Must be updateDeck at this point
    if (!deckId) {
      return errorResponse('Deck ID is required', 400);
    }

    // Verify deck ownership
    const [existingDeck] = await db
      .select()
      .from(deck)
      .where(eq(deck.id, deckId));

    if (!existingDeck) {
      return errorResponse('Deck not found', 404);
    }

    if (existingDeck.userId !== user.id) {
      return errorResponse('Not authorized to modify this deck', 403);
    }

    const updates: Record<string, any> = {};
    if (deckName) updates.name = sanitizeString(deckName);
    if (typeof win === 'number') updates.win = win;
    if (typeof loss === 'number') updates.loss = loss;

    await db.update(deck)
      .set(updates)
      .where(eq(deck.id, deckId));

    return successResponse({ success: true });
  });
}

export async function GET(event: RequestEvent) {
  return withAuth(event, async (event, { user }) => {
    const deckId = event.url.searchParams.get('deckId');
    if (!deckId) {
      return errorResponse('Deck ID is required', 400);
    }

    const [deckDetails] = await db
      .select()
      .from(deck)
      .where(eq(deck.id, deckId));

    if (!deckDetails) {
      return errorResponse('Deck not found', 404);
    }

    if (deckDetails.userId !== user.id) {
      return errorResponse('Not authorized to view this deck', 403);
    }

    return successResponse({ deck: deckDetails });
  });
}