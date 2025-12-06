export default {
  testEnvironment: 'node',
  
  // Module transformation for mixed CommonJS/ES module support
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // Module name mapping for ES module imports
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // Ensure node_modules are transformed when needed
  transformIgnorePatterns: [
    'node_modules/(?!((@whiskeysockets/baileys|@google/generative-ai|node-fetch|ws)/.*))' 
  ],
  
  collectCoverageFrom: [
    'backend/commands/**/*.js',
    'backend/middleware/**/*.js',
    'backend/src/**/*.js',
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
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js', '!frontend/**'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
    '/_legacy_archive/',
    '/frontend/',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/_legacy_archive/',
    '<rootDir>/frontend/src/shared/',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js', '<rootDir>/__tests__/mocks/prisma.js'],
  testTimeout: 10000,
  verbose: true,
  maxWorkers: '50%',
};
