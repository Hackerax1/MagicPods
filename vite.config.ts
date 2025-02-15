import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
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
