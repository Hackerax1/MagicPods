import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { v4 as uuidv4 } from 'uuid';
import { deck } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
	const { action, deckName, userId, deckId, win, loss } = await request.json();

	try {
		if (action === 'createDeck') {
			const newDeck = {
				id: uuidv4(),
				name: deckName,
				win: 0,
				loss: 0,
				userId: userId
			};
			await db.insert(deck).values(newDeck);
			return json({ success: true, deck: newDeck });
		} else if (action === 'updateDeck') {
			await db.update(deck).set({ name: deckName, win, loss }).where(eq(deck.id, deckId));
			return json({ success: true });
		} else {
			return json({ success: false, error: 'Invalid action' }, { status: 400 });
		}
	} catch (error) {
		return json({ success: false, error: (error as Error).message }, { status: 500 });
	}
}

export async function GET({ url }: { url: URL }) {
	const deckId = url.searchParams.get('deckId');

	try {
		const [deckDetails] = await db
			.select()
			.from(deck)
			.where(eq(deck.id, deckId as string));

		if (!deckDetails) {
			return json({ success: false, error: 'Deck not found' }, { status: 404 });
		}

		return json({ success: true, deck: deckDetails });
	} catch (error) {
		return json({ success: false, error: (error as Error).message }, { status: 500 });
	}
}