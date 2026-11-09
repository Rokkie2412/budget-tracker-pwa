import path from 'node:path';

import adapterStatic from '@sveltejs/adapter-static';
import adapterVercel from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src')
		}
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Capacitor bundles a static SPA; normal builds target Vercel (Node functions,
			// required because the API uses node:crypto, which cannot run on Edge).
			adapter:
				mode === 'capacitor'
					? adapterStatic({ fallback: 'index.html' })
					: adapterVercel()
		})
	]
}));
