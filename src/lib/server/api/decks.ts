import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { v4 as uuidv4 } from 'uuid';
import { deck } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
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

        const { action, deckName, deckId, win, loss } = body as any;

        // Input validation
        if (!action || (action !== 'createDeck' && action !== 'updateDeck')) {
            throw new ApiError('Invalid action', 400, ErrorCodes.INVALID_INPUT);
        }

        if (action === 'createDeck') {
            if (!deckName) {
                throw new ApiError('Deck name is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
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
                return newDeckRecord;
            });

            const response = successResponse({ deck: result }, undefined, version);
            return compressResponse(response, event);
        }

        if (action === 'updateDeck') {
            if (!deckId) {
                throw new ApiError('Deck ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
            }

            // Verify deck ownership
            const [existingDeck] = await db
                .select()
                .from(deck)
                .where(eq(deck.id, deckId));

            if (!existingDeck) {
                throw new ApiError('Deck not found', 404, ErrorCodes.NOT_FOUND);
            }

            if (existingDeck.userId !== user.id) {
                throw new ApiError('Access forbidden', 403, ErrorCodes.FORBIDDEN);
            }

            const updates: Record<string, any> = {};
            if (deckName) updates.name = sanitizeString(deckName);
            if (typeof win === 'number') updates.win = win;
            if (typeof loss === 'number') updates.loss = loss;

            await db.update(deck)
                .set(updates)
                .where(eq(deck.id, deckId));

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

        const deckId = event.url.searchParams.get('deckId');
        if (!deckId) {
            throw new ApiError('Deck ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
        }

        const [deckDetails] = await db
            .select()
            .from(deck)
            .where(eq(deck.id, deckId));

        if (!deckDetails) {
            throw new ApiError('Deck not found', 404, ErrorCodes.NOT_FOUND);
        }

        // Verify deck ownership or access rights
        if (deckDetails.userId !== user.id) {
            throw new ApiError('Access forbidden', 403, ErrorCodes.FORBIDDEN);
        }

        const response = successResponse({ deck: deckDetails }, undefined, version);
        return compressResponse(response, event);
    } catch (error) {
        return handleApiError(error, event);
    }
}