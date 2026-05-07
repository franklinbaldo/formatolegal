import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

export default [
	{
		ignores: ['dist/', '.astro/', 'node_modules/', 'playwright-report/', 'test-results/'],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	...astro.configs.recommended,
	...svelte.configs['flat/recommended'],
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tseslint.parser,
			},
		},
	},
	{
		languageOptions: {
			globals: {
				window: 'readonly',
				document: 'readonly',
				localStorage: 'readonly',
				HTMLElement: 'readonly',
				HTMLDivElement: 'readonly',
				HTMLButtonElement: 'readonly',
				HTMLInputElement: 'readonly',
				HTMLSelectElement: 'readonly',
				HTMLTextAreaElement: 'readonly',
				FileReader: 'readonly',
				File: 'readonly',
				Blob: 'readonly',
				URL: 'readonly',
				Event: 'readonly',
				DragEvent: 'readonly',
				KeyboardEvent: 'readonly',
				confirm: 'readonly',
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				requestAnimationFrame: 'readonly',
			},
		},
		rules: {
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		},
	},
];
