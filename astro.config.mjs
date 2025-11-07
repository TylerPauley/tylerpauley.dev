// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	output: 'static',
	// If using a project repository (e.g., tylerpauley/tylerpauley.dev):
	site: 'https://www.tylerpauley.dev/',
	base: '/tylerpauley.dev',
	
	// If using the main GitHub Pages site (tylerpauley/tylerpauley.github.io):
	// site: 'https://tylerpauley.github.io',
	// base: '/',
});
