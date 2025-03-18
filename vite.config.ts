import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
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
	}
});
