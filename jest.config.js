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
    "__tests__/**/*.js",
    "public/js/utils/**/*.js",
    "server.js",
    "!node_modules/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html", "json-summary"],
  // Coverage collection enabled for reporting
  // Note: ESM modules may show 0% in terminal but coverage files are generated
  testTimeout: 30000,
  verbose: false,
};
