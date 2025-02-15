import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	username: text('username').notNull().unique(),
	password: text('password').notNull(),
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const pod = pgTable('pod', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id)
});

export const deck = pgTable('deck', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	win: integer('win').notNull(),
	loss: integer('loss').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id)
});

export const card = pgTable('card', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	deckId: text('deck_id')
		.notNull()
		.references(() => deck.id)
});

export const podMembership = pgTable('pod_membership', {
	id: text('id').primaryKey(),
	podId: text('pod_id')
		.notNull()
		.references(() => pod.id),
	userId: text('user_id')
		.notNull()
		.references(() => user.id)
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Pod = typeof pod.$inferSelect;
export type Deck = typeof deck.$inferSelect;
export type Card = typeof card.$inferSelect;
export type PodMembership = typeof podMembership.$inferSelect;
