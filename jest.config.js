export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx|mjs)$': 'babel-jest',
  },
  extensionsToTreatAsEsm: ['.js', '.jsx', '.mjs'],
  collectCoverageFrom: [
    'commands/**/*.js',
    'middleware/**/*.js',
    'src/**/*.js',
    'context.js',
    'index.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!**/*.config.js',
    '!**/node_modules/**',
    '!**/coverage/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/', // Exclude e2e tests
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  verbose: true,
  maxWorkers: '50%',
};
