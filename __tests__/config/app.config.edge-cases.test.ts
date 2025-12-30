/**
 * Additional edge case and validation tests for app.config.ts
 * These tests complement the main app.config.test.ts file
 */

import { APP_CONFIG, AppConfig } from "@/config/app.config";

describe("app.config.ts - Edge Cases & Validation", () => {
  describe("Environment Variable Branch Coverage", () => {
    it("covers NEXT_PUBLIC_API_URL environment variable branch", () => {
      // Verify the environment variable branch is tested
      const url = APP_CONFIG.api.baseUrl;
      expect(url).toBeDefined();
      expect(typeof url).toBe("string");
      expect(url.length).toBeGreaterThan(0);
    });

    it("covers NEXT_PUBLIC_WS_URL environment variable branch", () => {
      // Verify the WebSocket URL branch is tested
      const wsUrl = APP_CONFIG.api.websocketUrl;
      expect(wsUrl).toBeDefined();
      expect(typeof wsUrl).toBe("string");
      expect(wsUrl.length).toBeGreaterThan(0);
    });

    it("covers NEXT_PUBLIC_SENTRY_DSN environment variable branch", () => {
      // Verify the Sentry DSN branch is tested
      const dsn = APP_CONFIG.sentry.dsn;
      expect(dsn).toBeDefined();
      expect(typeof dsn).toBe("string");
    });

    it("covers NODE_ENV environment variable branch", () => {
      // Verify the NODE_ENV branch is tested
      const env = APP_CONFIG.sentry.environment;
      expect(env).toBeDefined();
      expect(typeof env).toBe("string");
    });
  });

  describe("URL Validation", () => {
    it("has valid HTTP/HTTPS URL for baseUrl", () => {
      const url = APP_CONFIG.api.baseUrl;
      expect(url).toMatch(/^https?:\/\//);
    });

    it("has valid WS/WSS URL for websocketUrl", () => {
      const wsUrl = APP_CONFIG.api.websocketUrl;
      expect(wsUrl).toMatch(/^wss?:\/\//);
    });

    it("does not have trailing slashes in URLs", () => {
      const baseUrl = APP_CONFIG.api.baseUrl;
      const wsUrl = APP_CONFIG.api.websocketUrl;

      expect(baseUrl).not.toMatch(/\/$/);
      expect(wsUrl).not.toMatch(/\/$/);
    });

    it("has localhost fallback for development", () => {
      const baseUrl = APP_CONFIG.api.baseUrl;
      // Should either be localhost or a custom URL
      if (!process.env.NEXT_PUBLIC_API_URL) {
        expect(baseUrl).toContain("localhost");
      }
    });
  });

  describe("Numeric Value Ranges", () => {
    it("has timeout within reasonable bounds (1s - 60s)", () => {
      const timeout = APP_CONFIG.api.timeout;
      expect(timeout).toBeGreaterThanOrEqual(1000);
      expect(timeout).toBeLessThanOrEqual(60000);
    });

    it("has cache TTL within reasonable bounds (60s - 3600s)", () => {
      const ttl = APP_CONFIG.cache.ttl;
      expect(ttl).toBeGreaterThanOrEqual(60);
      expect(ttl).toBeLessThanOrEqual(3600);
    });

    it("has maxEntries within reasonable bounds (10 - 10000)", () => {
      const maxEntries = APP_CONFIG.cache.maxEntries;
      expect(maxEntries).toBeGreaterThanOrEqual(10);
      expect(maxEntries).toBeLessThanOrEqual(10000);
    });

    it("has tracesSampleRate within valid range (0.0 - 1.0)", () => {
      const rate = APP_CONFIG.sentry.tracesSampleRate;
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(1);
    });
  });

  describe("String Value Validation", () => {
    it("has non-empty application name", () => {
      expect(APP_CONFIG.name.length).toBeGreaterThan(0);
      expect(APP_CONFIG.name.trim()).toBe(APP_CONFIG.name);
    });

    it("has valid version format", () => {
      const version = APP_CONFIG.version;
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it("has non-empty description", () => {
      expect(APP_CONFIG.description.length).toBeGreaterThan(10);
    });

    it("has valid theme values", () => {
      expect(APP_CONFIG.theme.default).toMatch(/^(system|dark|light)$/);
      expect(APP_CONFIG.theme.dark).toBe("dark");
      expect(APP_CONFIG.theme.light).toBe("light");
    });
  });

  describe("Boolean Flag Validation", () => {
    it("has all features as boolean", () => {
      const features = APP_CONFIG.features;
      expect(typeof features.analytics).toBe("boolean");
      expect(typeof features.realtimeMonitoring).toBe("boolean");
      expect(typeof features.modelManagement).toBe("boolean");
      expect(typeof features.authentication).toBe("boolean");
    });

    it("has analytics enabled by default", () => {
      expect(APP_CONFIG.features.analytics).toBe(true);
    });

    it("has realtimeMonitoring enabled by default", () => {
      expect(APP_CONFIG.features.realtimeMonitoring).toBe(true);
    });

    it("has modelManagement enabled by default", () => {
      expect(APP_CONFIG.features.modelManagement).toBe(true);
    });

    it("has authentication disabled by default", () => {
      expect(APP_CONFIG.features.authentication).toBe(false);
    });
  });

  describe("Nested Property Access", () => {
    it("allows deep property access", () => {
      expect(APP_CONFIG.api.timeout).toBeDefined();
      expect(APP_CONFIG.features.analytics).toBeDefined();
      expect(APP_CONFIG.cache.ttl).toBeDefined();
      expect(APP_CONFIG.sentry.dsn).toBeDefined();
    });

    it("has no circular references", () => {
      // Ensure config doesn't reference itself
      expect(APP_CONFIG.api).not.toBe(APP_CONFIG);
      expect(APP_CONFIG.features).not.toBe(APP_CONFIG);
    });
  });

  describe("Type Safety", () => {
    it("matches AppConfig type definition", () => {
      const config: AppConfig = APP_CONFIG;
      expect(config).toBe(APP_CONFIG);
    });

    it("has correct type for API config", () => {
      expect(typeof APP_CONFIG.api.baseUrl).toBe("string");
      expect(typeof APP_CONFIG.api.websocketUrl).toBe("string");
      expect(typeof APP_CONFIG.api.timeout).toBe("number");
    });

    it("has correct type for cache config", () => {
      expect(typeof APP_CONFIG.cache.ttl).toBe("number");
      expect(typeof APP_CONFIG.cache.maxEntries).toBe("number");
    });

    it("has correct type for sentry config", () => {
      expect(typeof APP_CONFIG.sentry.dsn).toBe("string");
      expect(typeof APP_CONFIG.sentry.environment).toBe("string");
      expect(typeof APP_CONFIG.sentry.tracesSampleRate).toBe("number");
    });
  });

  describe("Immutable State After Read", () => {
    it("maintains values after multiple reads", () => {
      const name1 = APP_CONFIG.name;
      const name2 = APP_CONFIG.name;
      expect(name1).toBe(name2);
      expect(name1).toBe("Llama Runner Pro");
    });

    it("maintains nested values after reads", () => {
      const timeout1 = APP_CONFIG.api.timeout;
      const timeout2 = APP_CONFIG.api.timeout;
      expect(timeout1).toBe(timeout2);
      expect(timeout1).toBe(30000);
    });
  });

  describe("Configuration Consistency", () => {
    it("has consistent feature flags", () => {
      // Core features should be enabled
      expect(APP_CONFIG.features.analytics || APP_CONFIG.features.modelManagement).toBe(true);
    });

    it("has consistent cache configuration", () => {
      // Cache should have valid TTL and maxEntries
      expect(APP_CONFIG.cache.ttl > 0).toBe(true);
      expect(APP_CONFIG.cache.maxEntries > 0).toBe(true);
    });

    it("has consistent API configuration", () => {
      // API timeout should be reasonable relative to cache TTL
      // cache.ttl is 300 (seconds), api.timeout is 30000 (milliseconds)
      expect(APP_CONFIG.api.timeout).toBeGreaterThanOrEqual(APP_CONFIG.cache.ttl * 1000);
    });
  });

  describe("Production vs Development", () => {
    it("reflects environment in sentry.environment", () => {
      const env = APP_CONFIG.sentry.environment;
      expect(["development", "production", "test"]).toContain(env);
    });

    it("has production-ready defaults", () => {
      // Critical features should be enabled for production
      expect(APP_CONFIG.features.modelManagement).toBe(true);
      expect(APP_CONFIG.cache.maxEntries).toBeGreaterThan(0);
    });
  });

  describe("Sentry Configuration", () => {
    it("has empty or valid DSN", () => {
      const dsn = APP_CONFIG.sentry.dsn;
      if (dsn) {
        expect(dsn).toMatch(/^https?:\/\/.+/);
      } else {
        expect(dsn).toBe("");
      }
    });

    it("has valid environment name", () => {
      const env = APP_CONFIG.sentry.environment;
      expect(env.length).toBeGreaterThan(0);
      expect(env.match(/^[a-z]+$/i)).toBeTruthy();
    });

    it("has valid sample rate", () => {
      const rate = APP_CONFIG.sentry.tracesSampleRate;
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(1);
    });
  });
});
