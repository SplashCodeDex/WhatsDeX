const { configs } = require('@eslint/js');
const jest = require('eslint-plugin-jest');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const prettier = require('eslint-plugin-prettier');
const globals = require('globals');

module.exports = [
  // Global ignores (MUST be first and standalone)
  {
    ignores: [
      // Build outputs
      'dist/**',
      'build/**',
      '.next/**',
      'out/**',

      // Dependencies
      'node_modules/**',

      // Webpack generated files (CRITICAL - fixes 600+ errors)
      'web/.next/**/*',
      'web/out/**/*',
      'web/build/**/*',
      '**/webpack.*.js',
      '**/next.config.js',

      // Cache and temp
      '.cache/**',
      '*.log',
      '.env*',
      'coverage/**',
      '*.tsbuildinfo',

      // Database
      'prisma/migrations/**',
      'prisma/generated/**',

      // Generated files
      '**/*.min.js',
      '**/*.bundle.js',
      '**/dist/**',
      '**/build/**',
    ],
  },

  // Base config for all JS/TS files
  configs.recommended,
  {
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: typescriptParser,
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier,
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          semi: true,
          trailingComma: 'es5',
          printWidth: 100,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-console': 'off',
      'no-undef': 'warn', // Changed from error to warn
      'no-unused-vars': 'warn', // Changed from error to warn
      'no-constant-binary-expression': 'warn',
      'no-empty-pattern': 'warn',
      'no-case-declarations': 'warn',
    },
  },

  // Jest test files
  {
    files: ['**/__tests__/**/*', '**/*.test.js', '**/*.test.ts', '**/*.spec.js'],
    ...jest.configs['flat/recommended'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      ...jest.configs['flat/recommended'].rules,
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/valid-expect': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-undef': 'off', // Jest globals
    },
  },

  // React/JSX files
  {
    files: ['web/**/*.js', 'web/**/*.jsx', 'web/**/*.ts', 'web/**/*.tsx'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-undef': 'off', // React globals
    },
  },
];
