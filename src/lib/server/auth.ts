import type { RequestEvent } from '@sveltejs/kit';
import { eq, or } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { user, session } from '../server/db/schema';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = 'auth-session';

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	return token;
}

export async function createSession(token: string, userId: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: table.Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
	};
	await db.insert(table.session).values(session);
	return session;
}

export async function validateSessionToken(token: string | null) {
	if (!token) {
		return { session: null, user: null };
	}
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const [result] = await db
		.select({
			// Adjust user table here to tweak returned data
			user: { id: table.user.id, username: table.user.username },
			session: table.session
		})
		.from(table.session)
		.innerJoin(table.user, eq(table.session.userId, table.user.id))
		.where(eq(table.session.id, sessionId));

	if (!result) {
		return { session: null, user: null };
	}
	const { session, user } = result;

	const sessionExpired = Date.now() >= session.expiresAt.getTime();
	if (sessionExpired) {
		await db.delete(table.session).where(eq(table.session.id, session.id));
		return { session: null, user: null };
	}

	const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;
	if (renewSession) {
		session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
		await db
			.update(table.session)
			.set({ expiresAt: session.expiresAt })
			.where(eq(table.session.id, session.id));
	}

	return { session, user };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function invalidateSession(sessionId: string) {
	await db.delete(table.session).where(eq(table.session.id, sessionId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(sessionCookieName, token, {
		expires: expiresAt,
		path: '/'
	});
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, {
		path: '/'
	});
}

export async function register(email: string, username: string, password: string) {
	const hashedPassword = await bcrypt.hash(password, 10);
	const newUser = {
	  id: uuidv4(),
	  email,
	  username,
	  password: hashedPassword,
	  name: username,
	  age: null
	};
	await db.insert(user).values(newUser);
	return newUser;
}

export async function login(identifier: string, password: string) {
	const foundUsers = await db
		.select()
		.from(user)
		.where(or(eq(user.email, identifier), eq(user.username, identifier)))
		.limit(1);
	if (foundUsers.length === 0) {
		throw new Error('User not found');
	}
	const foundUser = foundUsers[0];
	const isPasswordValid = await bcrypt.compare(password, foundUser.password);
	if (!isPasswordValid) {
		throw new Error('Invalid password');
	}
	
	// Generate a session token
	const token = generateSessionToken();
	// Create the session using that token
	const newSession = await createSession(token, foundUser.id);
	
	return { user: foundUser, session: newSession, token };
}
