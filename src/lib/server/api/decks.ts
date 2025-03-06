import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { v4 as uuidv4 } from 'uuid';
import { deck } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { validateToken } from '$lib/server/auth';
import { successResponse, errorResponse, ApiErrors } from '$lib/server/utils/apiResponse';
import { standardRateLimit } from '$lib/server/utils/security/rateLimit';
import { sanitizeString } from '$lib/server/utils/security/sanitize';

import type { RequestEvent } from '@sveltejs/kit';

export async function POST(event: RequestEvent) {
    try {
        // Apply rate limiting
        await standardRateLimit(event);

        // Validate authentication
        const user = await validateToken(event);
        if (!user) {
            return errorResponse(ApiErrors.UNAUTHORIZED, 401);
        }

        const { action, deckName, deckId, win, loss } = await event.request.json();

        // Input validation
        if (!action || (action !== 'createDeck' && action !== 'updateDeck')) {
            return errorResponse(ApiErrors.INVALID_INPUT, 400);
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

            const result = await db.transaction(async (tx) => {
                const [newDeckRecord] = await tx.insert(deck).values(newDeck).returning();
                return deck;
            });

            return successResponse({ deck: result });
        }

        if (action === 'updateDeck') {
            if (!deckId) {
                return errorResponse('Deck ID is required', 400);
            }

            // Verify deck ownership
            const [existingDeck] = await db
                .select()
                .from(deck)
                .where(eq(deck.id, deckId));

            if (!existingDeck) {
                return errorResponse(ApiErrors.NOT_FOUND, 404);
            }

            if (existingDeck.userId !== user.id) {
                return errorResponse(ApiErrors.FORBIDDEN, 403);
            }

            const updates: Record<string, any> = {};
            if (deckName) updates.name = sanitizeString(deckName);
            if (typeof win === 'number') updates.win = win;
            if (typeof loss === 'number') updates.loss = loss;

            await db.update(deck)
                .set(updates)
                .where(eq(deck.id, deckId));

            return successResponse({ success: true });
        }
    } catch (error) {
        return errorResponse(error instanceof Error ? error : ApiErrors.SERVER_ERROR, 500);
    }
}

export async function GET(event: RequestEvent) {
    try {
        // Apply rate limiting
        await standardRateLimit(event);

        // Validate authentication
        const user = await validateToken(event);
        if (!user) {
            return errorResponse(ApiErrors.UNAUTHORIZED, 401);
        }

        const deckId = event.url.searchParams.get('deckId');
        if (!deckId) {
            return errorResponse('Deck ID is required', 400);
        }

        const [deckDetails] = await db
            .select()
            .from(deck)
            .where(eq(deck.id, deckId));

        if (!deckDetails) {
            return errorResponse(ApiErrors.NOT_FOUND, 404);
        }

        // Verify deck ownership or access rights
        if (deckDetails.userId !== user.id) {
            return errorResponse(ApiErrors.FORBIDDEN, 403);
        }

        return successResponse({ deck: deckDetails });
    } catch (error) {
        return errorResponse(error instanceof Error ? error : ApiErrors.SERVER_ERROR, 500);
    }
}