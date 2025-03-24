import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

// Check if we're building for GitHub Pages
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: false,  // Disable SvelteKit's fallback generation
			precompress: false,
			strict: false
		}),
		paths: {
			base: isGitHubPages ? '/MTGSvelte3' : ''
		},
		alias: {
			$lib: resolve('./src/lib')
		},
		prerender: {
			handleHttpError: ({ status }) => {
				// Don't fail the build on authentication errors
				if (status === 401 || status === 403) {
					return;
				}
				// Still handle other HTTP errors
				return;
			},
			handleMissingId: 'ignore',
			entries: isGitHubPages ? ['/'] : undefined
		}
	}
};

export default config;
