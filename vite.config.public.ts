import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { imagetools } from 'vite-imagetools';

export default defineConfig({
    plugins: [
        sveltekit(),
        imagetools({
            defaultDirectives: new URLSearchParams({
                format: 'webp',
                quality: '80',
                progressive: '1'
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
        },
        target: 'esnext',
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        },
        sourcemap: false,
        reportCompressedSize: true
    },
    ssr: {
        noExternal: ['@popperjs/core']
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