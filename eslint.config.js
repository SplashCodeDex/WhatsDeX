export default [
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
      'web/**',
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

  // Base config for all JS files
  {
    files: ['**/*.js', '!web/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'warn',
      'no-unused-vars': 'warn',
      'no-constant-binary-expression': 'warn',
      'no-empty-pattern': 'warn',
      'no-case-declarations': 'warn',
      'no-async-promise-executor': 'warn',
      'no-prototype-builtins': 'warn',
    },
  },

  // Test files
  {
    files: ['**/__tests__/**/*', '**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },

  // Web/React files
  {
    files: ['web/**/*.js', 'web/**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        React: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'no-undef': 'warn',
    },
  },
];
