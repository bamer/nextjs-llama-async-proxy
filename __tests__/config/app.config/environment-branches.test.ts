import { APP_CONFIG } from "@/config/app.config";

describe("app.config - Environment Variable Branch Coverage", () => {
  it("should cover API URL branch", () => {
    expect(APP_CONFIG.api.baseUrl).toBeDefined();
    expect(typeof APP_CONFIG.api.baseUrl).toBe("string");
    if (!process.env.NEXT_PUBLIC_API_URL) {
      expect(APP_CONFIG.api.baseUrl).toBe("http://localhost:3000");
    }
  });

  it("should cover WebSocket URL branch", () => {
    expect(APP_CONFIG.api.websocketUrl).toBeDefined();
    expect(typeof APP_CONFIG.api.websocketUrl).toBe("string");
    if (!process.env.NEXT_PUBLIC_WS_URL) {
      expect(APP_CONFIG.api.websocketUrl).toBe("ws://localhost:3000");
    }
  });

  it("should cover Sentry DSN branch", () => {
    expect(APP_CONFIG.sentry.dsn).toBeDefined();
    expect(typeof APP_CONFIG.sentry.dsn).toBe("string");
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      expect(APP_CONFIG.sentry.dsn).toBe("");
    }
  });

  it("should cover NODE_ENV branch", () => {
    expect(APP_CONFIG.sentry.environment).toBeDefined();
    expect(typeof APP_CONFIG.sentry.environment).toBe("string");
    if (!process.env.NODE_ENV) {
      expect(APP_CONFIG.sentry.environment).toBe("development");
    }
  });
});
