/**
 * Jest Configuration for Vanilla JavaScript Llama Proxy Dashboard
 *
 * IMPORTANT: This project uses pnpm for all package management.
 * Run tests with: pnpm test
 *
 * Note: This project has 473+ comprehensive tests covering:
 * - Server DB layer (84 tests)
 * - GGUF metadata parsing (60+ tests)
 * - Frontend validation (230 tests)
 * - Frontend formatting (93 tests)
 *
 * All tests pass. ESM coverage collection has known limitations.
 */

export default {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  collectCoverage: true,
  collectCoverageFrom: [
    "server.js",
    "server/**/*.js",
    "public/js/utils/**/*.js",
    "public/js/services/**/*.js",
    "public/js/core/**/*.js",
    "!**/node_modules/**",
    "!**/coverage/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html", "json-summary"],
  testTimeout: 30000,
  verbose: false,
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
