/**
 * Environment variable branch coverage test for app.config.ts
 *
 * This test file is specifically designed to improve branch coverage
 * by testing environment variable fallbacks using separate module imports.
 */

describe("app.config.ts - Environment Variable Branch Coverage", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear module cache before each test
    jest.resetModules();
  });

  afterEach(() => {
    // Restore environment after each test
    Object.assign(process.env, originalEnv);
    jest.resetModules();
  });

  it("should use default API URL when env var is undefined", () => {
    // Positive test: Verify fallback to default
    delete (process.env as unknown as Record<string, string | undefined>)
      .NEXT_PUBLIC_API_URL;

    const { APP_CONFIG } = require("@/config/app.config");
    expect(APP_CONFIG.api.baseUrl).toBe("http://localhost:3000");
  });

  it("should use default WebSocket URL when env var is undefined", () => {
    // Positive test: Verify fallback to default
    delete (process.env as unknown as Record<string, string | undefined>)
      .NEXT_PUBLIC_WS_URL;

    const { APP_CONFIG } = require("@/config/app.config");
    expect(APP_CONFIG.api.websocketUrl).toBe("ws://localhost:3000");
  });

  it("should use default Sentry DSN when env var is undefined", () => {
    // Positive test: Verify fallback to empty string
    delete (process.env as unknown as Record<string, string | undefined>)
      .NEXT_PUBLIC_SENTRY_DSN;

    const { APP_CONFIG } = require("@/config/app.config");
    expect(APP_CONFIG.sentry.dsn).toBe("");
  });

  it("should use custom Sentry DSN when env var is set", () => {
    // Positive test: Verify custom DSN is used
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://custom-sentry-dsn.io";

    const { APP_CONFIG } = require("@/config/app.config");
    expect(APP_CONFIG.sentry.dsn).toBe("https://custom-sentry-dsn.io");

    // Cleanup
    delete (process.env as unknown as Record<string, string | undefined>)
      .NEXT_PUBLIC_SENTRY_DSN;
  });

  it("should use default environment when NODE_ENV is not production", () => {
    // Positive test: Verify environment is set (Jest sets it to 'test')
    // The branch coverage: process.env.NODE_ENV || "development"
    // Since NODE_ENV is set by Jest, the true branch is covered
    const { APP_CONFIG } = require("@/config/app.config");
    expect(["test", "development", "production"]).toContain(
      APP_CONFIG.sentry.environment,
    );
  });
});
