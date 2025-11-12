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
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js', '<rootDir>/__tests__/mocks/prisma.js'],
  testTimeout: 10000,
  verbose: true,
  maxWorkers: '50%',
};
