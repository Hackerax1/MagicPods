import { startBulkDataUpdates } from '$lib/utils/scryfall.server';
import { invalidateCache } from '$lib/server/utils/apiResponseCache';
import type { Handle } from '@sveltejs/kit';
import { handleAuth } from '$lib/server/utils/middleware';

// Initialize performance optimizations
startBulkDataUpdates(24); // Update bulk data every 24 hours

// Cleanup cache periodically
setInterval(() => {
    invalidateCache(); // This will only clear expired entries
}, 60 * 60 * 1000); // Run every hour

export const handle: Handle = async ({ event, resolve }) => {
    // Handle authentication
    const authResult = await handleAuth(event);
    if (authResult instanceof Response) {
        return authResult;
    }
    
    // If auth was successful, authResult contains the user data
    if (authResult) {
        event.locals.user = authResult;
    }

    // Invalidate cache for specific routes if needed
    if (event.url.pathname.startsWith('/api')) {
        invalidateCache(event.url.pathname);
    }

    const response = await resolve(event);
    
    // Add performance-related headers
    response.headers.append('Cache-Control', 'public, max-age=3600');
    response.headers.append('Vary', 'Accept-Encoding');
    
    // Enable compression
    if (!response.headers.has('Content-Encoding') && response.headers.get('Content-Type')?.includes('text')) {
        response.headers.append('Content-Encoding', 'gzip');
    }
    
    return response;
};
