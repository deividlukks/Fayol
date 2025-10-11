module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./apps/*/tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  env: {
    node: true,
    jest: true,
    es2022: true,
  },
  rules: {
    // Prevenir erros que causaram problemas no projeto
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/interface-name-prefix': 'off',

    // Prevenir erros de sintaxe
    'no-irregular-whitespace': 'error',
    'no-unexpected-multiline': 'error',
    'no-unreachable': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-empty': 'warn',
    'no-ex-assign': 'error',

    // Qualidade de código
    'no-console': ['warn', { allow: ['warn', 'error', 'info', 'log'] }],
    'prefer-const': 'error',
    'no-var': 'error',

    // Prettier
    'prettier/prettier': ['error', {
      endOfLine: 'auto',
      singleQuote: true,
      trailingComma: 'all',
      printWidth: 100,
      tabWidth: 2,
      semi: true,
    }],
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    'coverage/',
    '.eslintrc.js',
    '*.config.js',
    '*.config.ts',
  ],
};
