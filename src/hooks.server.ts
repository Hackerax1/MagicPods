import type { Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';

const handleAuth: Handle = async ({ event, resolve }) => {
	// Get the user from the JWT token
	const user = await auth.validateToken(event);
	
	// Set user in locals for use in routes
	event.locals.user = user;
	
	return resolve(event);
};

export const handle: Handle = handleAuth;
