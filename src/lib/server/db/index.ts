import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import * as schema from './schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, inArray, and } from 'drizzle-orm';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
const client = postgres(env.DATABASE_URL);
export const db = drizzle(client);

export async function createPod(name: string, userId: string) {
	const podId = uuidv4();
	const newPod = {
		id: podId,
		name,
		userId
	};
	await db.insert(schema.pod).values(newPod);
	return newPod;
}

export async function inviteUserToPod(podId: string, userId: string) {
	const membershipId = uuidv4();
	const newMembership = {
		id: membershipId,
		podId,
		userId
	};
	await db.insert(schema.podMembership).values(newMembership);
	return newMembership;
}

export async function createDeck(name: string, userId: string) {
	const deckId = uuidv4();
	const newDeck = {
		id: deckId,
		name,
		userId,
		win: 0,
		loss: 0
	};
	await db.insert(schema.deck).values(newDeck);
	return newDeck;
}

export async function addCardToDeck(deckId: string, cardName: string) {
	const cardId = uuidv4();
	const newCard = {
		id: cardId,
		name: cardName,
		deckId,
		userId: '' // Add the appropriate userId value here
	};
	await db.insert(schema.card).values(newCard);
	return newCard;
}

export async function addCardToUserCollection(userId: string, card: any) {
	const cardId = uuidv4();
	const newCard = {
		id: cardId,
		name: card.name,
		userId,
		deckId: '' // Add the appropriate deckId value here
	};
	await db.insert(schema.card).values(newCard);
	return newCard;
}

export async function getUserPods(userId: string) {
	const pods = await db
		.select()
		.from(schema.pod)
		.where(eq(schema.pod.userId, userId));
	return pods;
}

export async function getPodMembers(podId: string) {
	const members = await db
		.select()
		.from(schema.podMembership)
		.where(eq(schema.podMembership.podId, podId));
	return members;
}

export async function getPodDecks(podId: string) {
	const decks = await db
		.select()
		.from(schema.deck)
		.where(inArray(
			schema.deck.userId,
			db.select({ userId: schema.podMembership.userId })
				.from(schema.podMembership)
				.where(eq(schema.podMembership.podId, podId))
		));
	return decks;
}

export async function getDeckCards(deckId: string) {
	const cards = await db
		.select()
		.from(schema.card)
		.where(eq(schema.card.deckId, deckId));
	return cards;
}

export async function removeUserFromPod(podId: string, userId: string) {
	await db
			.delete(schema.podMembership)
		.where(
			and(
				eq(schema.podMembership.podId, podId),
				eq(schema.podMembership.userId, userId)
			)
		);
}

export async function removeDeckFromPod(deckId: string) {
	await db
		.delete(schema.deck)
		.where(eq(schema.deck.id, deckId));
}

export async function updateWinLoss(deckId: string, win: number, loss: number) {
	await db
		.update(schema.deck)
		.set({ win, loss })
		.where(eq(schema.deck.id, deckId));
}

export async function loginUser(username: string, password: string) {
	const user = await db
		.select()
		.from(schema.user)
		.where(
			and(
				eq(schema.user.username, username),
				eq(schema.user.password, password)
			)
		);
	return user;
}

export async function fetchPodDetails(podId: string) {
	const podDetails = await db
		.select()
		.from(schema.pod)
		.where(eq(schema.pod.id, podId));
	return podDetails;
}