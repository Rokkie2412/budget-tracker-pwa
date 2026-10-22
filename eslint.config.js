import tsParser from '@typescript-eslint/parser';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import svelteParser from 'svelte-eslint-parser';

const importSortingRules = {
	'simple-import-sort/imports': [
		'error',
		{
			groups: [
				['^\\u0000'],
				['^node:'],
				['^@?\\w'],
				['^\\$app/'],
				['^#lib(?:/|$)', '^\\$lib(?:/|$)'],
				['^\\.']
			]
		}
	]
};

export default [
	{
		ignores: ['**/.svelte-kit/**', '**/node_modules/**', '**/build/**', '**/android/**']
	},
	{
		files: ['**/*.{js,ts}'],
		languageOptions: {
			parser: tsParser
		},
		plugins: {
			'simple-import-sort': simpleImportSort
		},
		rules: importSortingRules
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser
			}
		},
		plugins: {
			'simple-import-sort': simpleImportSort
		},
		rules: importSortingRules
	}
];
