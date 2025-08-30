import { resolve } from 'path';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';

const config: any = [
  {
    ignores: ['node_modules/', 'dist/', '.bun/', '.env'],
  },
  {
    files: ['**/*.{ts,tsx,js}'],
    languageOptions: {
      parser: tsParser as any,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        project: [resolve(process.cwd(), 'tsconfig.json')],
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin as any,
      import: importPlugin as any,
    },
    settings: {},
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn'],
      'no-console': 'off',
      'import/order': ['warn', { alphabetize: { order: 'asc' } }],
    },
  },
];

export default config;
