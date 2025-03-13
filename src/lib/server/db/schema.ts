import { pgTable, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    username: text('username').notNull().unique(),
    password: text('password').notNull(),
    emailVerified: boolean('email_verified').notNull().default(true),
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
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
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

export const userCard = pgTable('user_card', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	cardId: text('card_id')
		.notNull()
		.references(() => card.id),
	quantity: integer('quantity').notNull(),
	condition: text('condition').notNull()
});

export const trade = pgTable('trade', {
	id: text('id').primaryKey(),
	podId: text('pod_id')
		.notNull()
		.references(() => pod.id),
	status: text('status').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const tradeNotification = pgTable('trade_notification', {
    id: text('id').primaryKey(),
    tradeId: text('trade_id')
        .notNull()
        .references(() => trade.id),
    userId: text('user_id')
        .notNull()
        .references(() => user.id),
    message: text('message').notNull(),
    read: integer('read').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const tradeParticipant = pgTable('trade_participant', {
	id: text('id').primaryKey(),
	tradeId: text('trade_id')
		.notNull()
		.references(() => trade.id),
	userId: text('user_id')
		.notNull()
		.references(() => user.id)
});

export const tradeItem = pgTable('trade_item', {
	id: text('id').primaryKey(),
	tradeId: text('trade_id')
		.notNull()
		.references(() => trade.id),
	userCardId: text('user_card_id')
		.notNull()
		.references(() => userCard.id),
	quantity: integer('quantity').notNull()
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Pod = typeof pod.$inferSelect;
export type Deck = typeof deck.$inferSelect;
export type Card = typeof card.$inferSelect;
export type PodMembership = typeof podMembership.$inferSelect;
export type UserCard = typeof userCard.$inferSelect;
export type Trade = typeof trade.$inferSelect;
export type TradeParticipant = typeof tradeParticipant.$inferSelect;
export type TradeItem = typeof tradeItem.$inferSelect;
export type TradeNotification = typeof tradeNotification.$inferSelect;
