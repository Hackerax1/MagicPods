import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Check if we're building for GitHub Pages
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Using adapter-static for GitHub Pages deployment
		adapter: adapter({
			// default options are shown
			pages: 'build',           // Output directory for the client build
			assets: 'build',          // Output directory for assets
			fallback: 'index.html',   // Fallback for SPA routing (changed from 200.html for GitHub Pages)
			precompress: false,       // Precompress assets
			strict: !isGitHubPages    // Less strict when building for GitHub Pages
		}),
		// Needed for GitHub Pages deployment - repository name
		paths: {
			base: isGitHubPages ? '/MTGSvelte3' : ''
		},
		// This tells SvelteKit to prerender routes
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				// Ignore 404s and API errors during prerendering for GitHub Pages
				if (isGitHubPages) return;
				
				// Only fail on errors unrelated to missing APIs or 404s
				if (message.includes('Not found') || path.includes('/api/')) return;
				
				// Otherwise, fail the build
				throw new Error(message);
			},
			// Ignore missing IDs for dynamic routes in GitHub Pages mode
			handleMissingId: isGitHubPages ? 'ignore' : 'fail',
			// Only prerender specific routes for GitHub Pages
			entries: isGitHubPages ? ['/', '/404'] : undefined
		}
	}
};

export default config;
