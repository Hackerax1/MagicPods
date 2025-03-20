// Check if we're building for GitHub Pages
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

// Only import server-side modules if not building for GitHub Pages
import type { Handle } from '@sveltejs/kit';

// Conditional imports for server-side functionality
const serverUtils = !isGitHubPages ? {
    startBulkDataUpdates: async (hours: number) => {
        const { startBulkDataUpdates } = await import('$lib/utils/scryfall.server');
        return startBulkDataUpdates(hours);
    },
    invalidateCache: async (path?: string) => {
        const { invalidateCache } = await import('$lib/server/utils/apiResponseCache');
        return invalidateCache(path);
    },
    handleAuth: async (event: any) => {
        const { handleAuth } = await import('$lib/server/utils/middleware');
        return handleAuth(event);
    }
} : {
    startBulkDataUpdates: (_hours: number) => { /* No-op for GitHub Pages */ },
    invalidateCache: (_path?: string) => { /* No-op for GitHub Pages */ },
    handleAuth: async (_event: any) => { return null; /* No-op for GitHub Pages */ }
};

// Initialize performance optimizations (only if not GitHub Pages)
if (!isGitHubPages) {
    // Update bulk data every 24 hours
    serverUtils.startBulkDataUpdates(24);
    
    // Cleanup cache periodically
    setInterval(() => {
        serverUtils.invalidateCache(); // This will only clear expired entries
    }, 60 * 60 * 1000); // Run every hour
}

export const handle: Handle = async ({ event, resolve }) => {
    if (!isGitHubPages) {
        // Handle authentication
        const authResult = await serverUtils.handleAuth(event);
        if (authResult instanceof Response) {
            return authResult;
        }
        
        // If auth was successful, authResult contains the user data
        if (authResult) {
            event.locals.user = authResult;
        }

        // Invalidate cache for specific routes if needed
        if (event.url.pathname.startsWith('/api')) {
            serverUtils.invalidateCache(event.url.pathname);
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
