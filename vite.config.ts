import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { imagetools } from 'vite-imagetools';

export default defineConfig({
	plugins: [
		sveltekit(),
		imagetools({
			defaultDirectives: new URLSearchParams({
				format: 'webp',
				quality: '80',
				progressive: '1',
				source: '0'
			})
		})
	],
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					'scryfall': ['$lib/utils/scryfall'],
					'ui': ['$lib/components/ui/Button.svelte', '$lib/components/ui/Card.svelte', '$lib/components/ui/Input.svelte', '$lib/components/ui/Select.svelte']
				}
			},
			// Exclude server-specific files from the client build
			external: ['fs', 'path', '$lib/utils/scryfall.server']
		}
	},
	resolve: {
		alias: {
			$lib: '/src/lib'
		},
		extensions: ['.svelte', '.js', '.ts']
	},
	optimizeDeps: {
		exclude: [
			'clsx',
			'devalue',
			'drizzle-orm',
			'@oslojs/crypto/sha2',
			'@oslojs/encoding',
			'bcryptjs',
			'uuid',
			'drizzle-orm/postgres-js',
			'postgres',
			'drizzle-orm/pg-core'
		],
		include: ['svelte']
	},
	// Add image performance options
	server: {
		fs: {
			strict: false, // Needed for imagetools in development
		},
	},
	preview: {
		headers: {
			// Add cache headers for images
			'/*.webp': {
				'Cache-Control': 'public, max-age=31536000, immutable'
			},
			'/*.jpg': {
				'Cache-Control': 'public, max-age=31536000, immutable'
			},
			'/*.png': {
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		}
	}
});
