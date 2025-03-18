import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Using adapter-node for Node.js server deployment
		// See https://kit.svelte.dev/docs/adapter-node for more information about configuration options
		adapter: adapter({
			// Configuration options (all are optional)
			// out: 'build',         // Output directory for the server (default: 'build')
			// precompress: false,   // Precompress assets (default: false)
			// envPrefix: '',        // Prefix for environment variables (default: '')
			// polyfill: true        // Whether to include node polyfills (default: true)
		})
	}
};

export default config;
