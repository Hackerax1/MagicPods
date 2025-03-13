import { json } from '@sveltejs/kit';
import { fetchCard } from '$lib/utils/scryfall';
import { addCardToUserCollection } from '$lib/server/db';
import { validateToken } from '$lib/server/auth';
import { successResponse, errorResponse, ApiErrors } from '$lib/server/utils/apiResponse';
import { standardRateLimit } from '$lib/server/utils/security/rateLimit';
import { sanitizeString } from '$lib/server/utils/security/sanitize';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

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

    const { cardName, csvFile } = await event.request.json();

    if (!cardName && !csvFile) {
      return errorResponse('Either cardName or csvFile is required', 400);
    }

    if (cardName) {
      const sanitizedCardName = sanitizeString(cardName);
      try {
        const card = await fetchCard(sanitizedCardName);
        await addCardToUserCollection(user.id, card);
        return successResponse({ card });
      } catch (error) {
        return errorResponse('Card not found or error adding to collection', 404);
      }
    }

    if (csvFile) {
      try {
        const cards = await processCSV(csvFile, user.id);
        const failedCards = cards.filter(card => card.error);
        const successfulCards = cards.filter(card => !card.error);
        
        if (failedCards.length > 0) {
          return successResponse({ 
            cards: successfulCards,
            errors: failedCards.map(c => ({ name: c.name, error: c.error }))
          });
        }
        return successResponse({ cards: successfulCards });
      } catch (error) {
        return errorResponse('Error processing CSV file: ' + (error instanceof Error ? error.message : 'Unknown error'), 400);
      }
    }
  } catch (error) {
    return errorResponse(error instanceof Error ? error : ApiErrors.SERVER_ERROR, 500);
  }
}

interface CSVRow {
  name: string;
  quantity?: number;
}

async function processCSV(file: Buffer, userId: string): Promise<any[]> {
  const cards: any[] = [];
  const stream = Readable.from(file);
  let hasError = false;

  return new Promise((resolve, reject) => {
    stream.pipe(csvParser())
      .on('data', async (row: CSVRow) => {
        try {
          const sanitizedName = sanitizeString(row.name);
          const card = await fetchCard(sanitizedName);
          const quantity = Math.max(1, Math.floor(Number(row.quantity) || 1));
          await addCardToUserCollection(userId, card);
          cards.push({ ...card, quantity });
        } catch (error) {
          hasError = true;
          cards.push({ 
            name: row.name, 
            error: 'Failed to add card' 
          });
        }
      })
      .on('end', () => {
        if (hasError) {
          resolve(cards.filter(card => !card.error));
        } else {
          resolve(cards);
        }
      })
      .on('error', reject);
  });
}