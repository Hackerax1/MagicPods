import type { RequestEvent } from '@sveltejs/kit';
import { validateToken } from '../auth';
import { errorResponse, ApiErrors } from './apiResponse';

interface ProtectedRouteOptions {
    allowUnverifiedEmail?: boolean;
}

const PUBLIC_ROUTES = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/reset-password'
];

export async function handleAuth(event: RequestEvent, options: ProtectedRouteOptions = {}) {
    const path = event.url.pathname;
    
    // Skip auth for public routes
    if (PUBLIC_ROUTES.includes(path)) {
        return null;
    }

    const user = await validateToken(event);
    if (!user) {
        return errorResponse(ApiErrors.UNAUTHORIZED, 401);
    }

    // For protected routes that require verification
    if (!options.allowUnverifiedEmail && !user.verified) {
        return errorResponse('Email not verified', 403);
    }

    return user;
}

export async function withAuth(event: RequestEvent, callback: (event: RequestEvent, context: { user: any }) => Promise<Response>) {
    const user = await handleAuth(event);
    if (!user) {
        return errorResponse(ApiErrors.UNAUTHORIZED, 401);
    }

    return callback(event, { user });
}