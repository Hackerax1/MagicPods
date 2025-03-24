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
			fallback: '404.html',  // Changed to 404.html for GitHub Pages
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
			handleHttpError: () => {
				// Ignore all HTTP errors during prerendering
				return;
			},
			handleMissingId: 'ignore',
			entries: isGitHubPages ? ['/'] : undefined
		}
	}
};

export default config;
