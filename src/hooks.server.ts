import type { Handle } from '@sveltejs/kit';
import { validateToken } from '$lib/server/auth';
import { handleAuth } from '$lib/server/utils/middleware';

export const handle: Handle = async ({ event, resolve }) => {
    // Handle authentication
    const authResult = await handleAuth(event);
    if (authResult) {
        return authResult;
    }

    const response = await resolve(event);
    return response;
};
