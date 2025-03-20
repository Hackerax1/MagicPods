// Client-side hooks for GitHub Pages
import type { HandleClientError } from '@sveltejs/kit';

// Handle client-side errors
export const handleError: HandleClientError = ({ error, event }) => {
    console.error('Client error:', error);
    
    // Return a simplified error for the user
    return {
        message: 'An unexpected error occurred',
        status: 500
    };
};
