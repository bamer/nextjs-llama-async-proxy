/**
 * Jest Configuration for Vanilla JavaScript Llama Proxy Dashboard
 */

export default {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'public/js/**/*.js',
    '!public/js/**/*.test.js',
    '!public/js/utils/**/*.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30
    }
  },
  testTimeout: 10000,
  verbose: true,
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons', 'browser']
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js']
};
