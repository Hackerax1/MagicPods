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
					'card-scanner': ['$lib/components/CardScanner'],
					'deck-builder': ['$lib/components/DeckBuilder', '$lib/components/DeckList', '$lib/components/DeckStats', '$lib/components/DeckExport'],
					'pod-manager': ['$lib/components/Pod', '$lib/components/TradeHistory', '$lib/components/TradeNotifications'],
					'ui': ['$lib/components/ui/Button', '$lib/components/ui/Card', '$lib/components/ui/Input', '$lib/components/ui/Select']
				}
			}
		}
	},
	resolve: {
		alias: {
			// ...existing code...
		},
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
		]
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
