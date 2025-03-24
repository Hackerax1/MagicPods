// Check if we're building for GitHub Pages
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

import type { Handle } from '@sveltejs/kit';
import { handleAuth } from '$lib/server/utils/middleware';
import { checkJwtConfig } from '$lib/server/auth-helper';
import { env } from '$env/dynamic/private';

// Add type declaration for custom global property
declare global {
    var __bulkDataUpdatesInitialized: boolean | undefined;
}

// Check JWT configuration on startup
const jwtConfigValid = checkJwtConfig();
if (!jwtConfigValid) {
    console.error('JWT configuration is invalid. Please check your environment variables.');
}

// Skip all server-side functionality when building for GitHub Pages
export const handle: Handle = async ({ event, resolve }) => {
    const path = event.url.pathname;

    // Skip auth for public paths
    if (path === '/' || path.startsWith('/static/') || path.startsWith('/_app/') || path === '/favicon.ico') {
        return resolve(event);
    }

    if (!isGitHubPages) {
        try {
            const { handleAuth } = await import('./lib/server/utils/middleware');
            const { invalidateCache } = await import('./lib/server/utils/apiResponseCache');
            const { startBulkDataUpdates } = await import('./lib/utils/scryfall.server');

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

            // Initialize bulk data updates if not already done
            if (typeof globalThis.__bulkDataUpdatesInitialized === 'undefined') {
                globalThis.__bulkDataUpdatesInitialized = true;
                startBulkDataUpdates(24);
                setInterval(() => {
                    invalidateCache();
                }, 60 * 60 * 1000);
            }
        } catch (error) {
            console.error('Error in server hooks:', error);
        }
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
