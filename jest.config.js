/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transformIgnorePatterns: [
    '/node_modules/(?!(playwright)/)',
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
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  maxWorkers: '50%'
};