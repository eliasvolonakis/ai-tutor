// eslint config as TS — keep plugins typed loosely to avoid requiring eslint's Plugin type
const config: any = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: 'module',
    project: ['./tsconfig.json'],
  },
  env: {
    node: true,
    es2024: true,
  },
  plugins: ['@typescript-eslint', 'import'] as any,
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn'],
    'no-console': 'off',
    'import/order': ['warn', { alphabetize: { order: 'asc' } }],
  },
};

export default config;
