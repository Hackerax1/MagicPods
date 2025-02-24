import { json } from '@sveltejs/kit';
import { fetchCard } from '$lib/utils/scryfall';
import { addCardToUserCollection } from '$lib/server/db';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
  const { cardName, csvFile, userId } = await request.json();

  if (cardName) {
    const card = await fetchCard(cardName);
    await addCardToUserCollection(userId, card);
    return json(card);
  }

  if (csvFile) {
    const cards = await processCSV(csvFile, userId);
    return json(cards);
  }

  return json({ error: 'Invalid request' }, { status: 400 });
}

interface CSVRow {
    name: string;
}

async function processCSV(file: Buffer, userId: string): Promise<any[]> {
    const cards: any[] = [];
    const stream = Readable.from(file);

    return new Promise((resolve, reject) => {
        stream.pipe(csvParser())
            .on('data', async (row: CSVRow) => {
                const card = await fetchCard(row.name);
                await addCardToUserCollection(userId, card);
                cards.push(card);
            })
            .on('end', () => resolve(cards))
            .on('error', reject);
    });
}