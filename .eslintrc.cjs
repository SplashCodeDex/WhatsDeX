module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,  // ← CRITICAL: Enables module, process, __dirname, etc.
    commonjs: true,  // ← Enables CommonJS globals
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // MUST be last
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  globals: {
    // Explicitly define Node.js globals
    module: 'readonly',
    require: 'readonly',
    process: 'readonly',
    __dirname: 'readonly',
    __filename: 'readonly',
  },
  rules: {
    'prettier/prettier': ['error', {
      singleQuote: true,
      semi: true,
      trailingComma: 'es5',
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-console': 'off',  // Allow console in development
    'no-undef': 'error',  // Keep for catching actual undefined vars
  },
  overrides: [
    {
      // Jest test files
      files: ['**/__tests__/**/*', '**/*.test.js', '**/*.test.ts', '**/*.spec.js', '**/*.spec.ts'],
      plugins: ['jest'],
      env: {
        'jest/globals': true,
        node: true,
      },
      extends: ['plugin:jest/recommended'],
      rules: {
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/valid-expect': 'error',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      // React/JSX files
      files: ['**/*.jsx', '**/*.tsx', 'web/**/*.js', 'web/**/*.ts'],
      env: {
        browser: true,
        es2021: true,
      },
      extends: [
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
      ],
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        'react/react-in-jsx-scope': 'off',  // Not needed in React 17+
        'react/prop-types': 'off',  // Using TypeScript for prop validation
      },
    },
    {
      // CommonJS config files
      files: ['*.cjs', '.*.cjs'],
      env: {
        node: true,
        commonjs: true,
      },
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
};