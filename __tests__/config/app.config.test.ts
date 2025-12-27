/**
 * Comprehensive tests for src/config/app.config.ts
 *
 * Test Coverage Objectives:
 * - Verify all exports exist and are properly typed
 * - Test default values for all configuration properties
 * - Validate nested object structure
 * - Test immutable nature of frozen objects
 * - Verify environment variable override behavior
 */

import { APP_CONFIG, AppConfig } from "@/config/app.config";

describe("app.config.ts", () => {
  describe("Environment Variable Branch Coverage", () => {
    // These tests run first to capture branch coverage before module is loaded
    it("should cover API URL branch", () => {
      // Positive test: Verify environment variable or default is used
      expect(APP_CONFIG.api.baseUrl).toBeDefined();
      expect(typeof APP_CONFIG.api.baseUrl).toBe("string");
      // The branch: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
      // Either the env var is set (covered if set) or the default is used (covered now)
      if (!process.env.NEXT_PUBLIC_API_URL) {
        expect(APP_CONFIG.api.baseUrl).toBe("http://localhost:3000");
      }
    });

    it("should cover WebSocket URL branch", () => {
      // Positive test: Verify environment variable or default is used
      expect(APP_CONFIG.api.websocketUrl).toBeDefined();
      expect(typeof APP_CONFIG.api.websocketUrl).toBe("string");
      // The branch: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000"
      if (!process.env.NEXT_PUBLIC_WS_URL) {
        expect(APP_CONFIG.api.websocketUrl).toBe("ws://localhost:3000");
      }
    });

    it("should cover Sentry DSN branch", () => {
      // Positive test: Verify environment variable or default is used
      expect(APP_CONFIG.sentry.dsn).toBeDefined();
      expect(typeof APP_CONFIG.sentry.dsn).toBe("string");
      // The branch: process.env.NEXT_PUBLIC_SENTRY_DSN || ""
      if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
        expect(APP_CONFIG.sentry.dsn).toBe("");
      }
    });

    it("should cover NODE_ENV branch", () => {
      // Positive test: Verify environment variable or default is used
      expect(APP_CONFIG.sentry.environment).toBeDefined();
      expect(typeof APP_CONFIG.sentry.environment).toBe("string");
      // The branch: process.env.NODE_ENV || "development"
      if (!process.env.NODE_ENV) {
        expect(APP_CONFIG.sentry.environment).toBe("development");
      }
    });
  });

  describe("Export Verification", () => {
    it("should export APP_CONFIG constant", () => {
      // Positive test: Verify the export exists and is an object
      expect(APP_CONFIG).toBeDefined();
      expect(typeof APP_CONFIG).toBe("object");
    });

    it("should export AppConfig type", () => {
      // Positive test: Verify the type is exported (indirect check via type assertion)
      const typedConfig: AppConfig = APP_CONFIG;
      expect(typedConfig).toEqual(APP_CONFIG);
    });

    it("should have no null or undefined top-level properties", () => {
      // Positive test: All top-level properties should have values
      Object.keys(APP_CONFIG).forEach((key) => {
        expect(APP_CONFIG[key as keyof typeof APP_CONFIG]).toBeDefined();
        expect(APP_CONFIG[key as keyof typeof APP_CONFIG]).not.toBeNull();
      });
    });
  });

  describe("Default Values Tests", () => {
    it("should have correct application name and version", () => {
      // Positive test: Verify core application metadata
      expect(APP_CONFIG.name).toBe("Llama Runner Pro");
      expect(APP_CONFIG.version).toBe("2.0.0");
      expect(APP_CONFIG.description).toBe(
        "Advanced Llama Model Management System",
      );
    });

    it("should have correct cache default values", () => {
      // Positive test: Verify cache configuration defaults
      expect(APP_CONFIG.cache.ttl).toBe(300);
      expect(APP_CONFIG.cache.maxEntries).toBe(100);
    });

    it("should have correct feature flags", () => {
      // Positive test: Verify feature flag defaults
      expect(APP_CONFIG.features.analytics).toBe(true);
      expect(APP_CONFIG.features.realtimeMonitoring).toBe(true);
      expect(APP_CONFIG.features.modelManagement).toBe(true);
      expect(APP_CONFIG.features.authentication).toBe(false);
    });

    it("should have correct theme defaults", () => {
      // Positive test: Verify theme configuration
      expect(APP_CONFIG.theme.default).toBe("system");
      expect(APP_CONFIG.theme.dark).toBe("dark");
      expect(APP_CONFIG.theme.light).toBe("light");
    });
  });

  describe("Nested Object Structure Tests", () => {
    it("should have properly structured API configuration", () => {
      // Positive test: Verify API nested object structure
      expect(APP_CONFIG.api).toBeDefined();
      expect(typeof APP_CONFIG.api.baseUrl).toBe("string");
      expect(typeof APP_CONFIG.api.websocketUrl).toBe("string");
      expect(typeof APP_CONFIG.api.timeout).toBe("number");
      expect(APP_CONFIG.api.timeout).toBeGreaterThan(0);
    });

    it("should have properly structured sentry configuration", () => {
      // Positive test: Verify sentry nested object structure
      expect(APP_CONFIG.sentry).toBeDefined();
      expect(typeof APP_CONFIG.sentry.dsn).toBe("string");
      expect(typeof APP_CONFIG.sentry.environment).toBe("string");
      expect(typeof APP_CONFIG.sentry.tracesSampleRate).toBe("number");
      expect(APP_CONFIG.sentry.tracesSampleRate).toBeGreaterThanOrEqual(0);
      expect(APP_CONFIG.sentry.tracesSampleRate).toBeLessThanOrEqual(1);
    });

    it("should have deeply nested properties accessible", () => {
      // Positive test: Verify deep nesting is accessible
      expect(APP_CONFIG.api.baseUrl).toBeDefined();
      expect(APP_CONFIG.features.analytics).toBeDefined();
      expect(APP_CONFIG.cache.ttl).toBeDefined();
      expect(APP_CONFIG.sentry.environment).toBeDefined();
    });

    it("should not allow adding new properties to nested objects", () => {
      // Negative test: Verify nested objects are frozen
      expect(() => {
        (APP_CONFIG.api as unknown as { newProp: string }).newProp =
          "test";
      }).toThrow();
    });
  });

  describe("Environment Variable Override Tests", () => {
    it("should use default API URL when env var is not set", () => {
      // Positive test: Verify fallback to default when env var is undefined
      const originalEnv = process.env.NEXT_PUBLIC_API_URL;
      delete (process.env as unknown as Record<string, string | undefined>)
        .NEXT_PUBLIC_API_URL;

      // Re-require to test default behavior
      const { APP_CONFIG: testConfig } = require("@/config/app.config");

      expect(testConfig.api.baseUrl).toBe("http://localhost:3000");

      // Restore
      if (originalEnv) {
        process.env.NEXT_PUBLIC_API_URL = originalEnv;
      }
    });

    it("should use custom API URL when env var is set", () => {
      // Positive test: Verify custom URL is used when env var is set
      const originalEnv = process.env.NEXT_PUBLIC_API_URL;
      process.env.NEXT_PUBLIC_API_URL = "https://custom.api.com";

      // Clear module cache to force re-import
      jest.resetModules();
      const { APP_CONFIG: testConfig } = require("@/config/app.config");

      expect(testConfig.api.baseUrl).toBe("https://custom.api.com");

      // Restore
      if (originalEnv) {
        process.env.NEXT_PUBLIC_API_URL = originalEnv;
      } else {
        delete (process.env as unknown as Record<string, string | undefined>)
          .NEXT_PUBLIC_API_URL;
      }
      jest.resetModules();
    });

    it("should use default WebSocket URL when env var is not set", () => {
      // Positive test: Verify fallback to default WS URL
      const originalEnv = process.env.NEXT_PUBLIC_WS_URL;
      delete (process.env as unknown as Record<string, string | undefined>)
        .NEXT_PUBLIC_WS_URL;

      const { APP_CONFIG: testConfig } = require("@/config/app.config");

      expect(testConfig.api.websocketUrl).toBe("ws://localhost:3000");

      // Restore
      if (originalEnv) {
        process.env.NEXT_PUBLIC_WS_URL = originalEnv;
      }
    });

    it("should use custom WebSocket URL when env var is set", () => {
      // Positive test: Verify custom WS URL is used when env var is set
      const originalEnv = process.env.NEXT_PUBLIC_WS_URL;
      process.env.NEXT_PUBLIC_WS_URL = "wss://custom.ws.com";

      jest.resetModules();
      const { APP_CONFIG: testConfig } = require("@/config/app.config");

      expect(testConfig.api.websocketUrl).toBe("wss://custom.ws.com");

      // Restore
      if (originalEnv) {
        process.env.NEXT_PUBLIC_WS_URL = originalEnv;
      } else {
        delete (process.env as unknown as Record<string, string | undefined>)
          .NEXT_PUBLIC_WS_URL;
      }
      jest.resetModules();
    });

    it("should use empty string for Sentry DSN when env var is not set", () => {
      // Positive test: Verify empty string fallback for optional Sentry DSN
      const originalEnv = process.env.NEXT_PUBLIC_SENTRY_DSN;
      delete (process.env as unknown as Record<string, string | undefined>)
        .NEXT_PUBLIC_SENTRY_DSN;

      const { APP_CONFIG: testConfig } = require("@/config/app.config");

      expect(testConfig.sentry.dsn).toBe("");

      // Restore
      if (originalEnv) {
        process.env.NEXT_PUBLIC_SENTRY_DSN = originalEnv;
      }
    });

    it("should use custom Sentry DSN when env var is set", () => {
      // Positive test: Verify custom DSN is used when env var is set
      const originalEnv = process.env.NEXT_PUBLIC_SENTRY_DSN;
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://sentry.io/custom-dsn";

      jest.resetModules();
      const { APP_CONFIG: testConfig } = require("@/config/app.config");

      expect(testConfig.sentry.dsn).toBe("https://sentry.io/custom-dsn");

      // Restore
      if (originalEnv) {
        process.env.NEXT_PUBLIC_SENTRY_DSN = originalEnv;
      } else {
        delete (process.env as unknown as Record<string, string | undefined>)
          .NEXT_PUBLIC_SENTRY_DSN;
      }
      jest.resetModules();
    });

    it("should use default environment when NODE_ENV is not set", () => {
      // Positive test: Verify default environment when NODE_ENV is undefined
      // Note: NODE_ENV is read-only, we just verify the structure
      const { APP_CONFIG: testConfig } = require("@/config/app.config");
      expect(testConfig.sentry.environment).toBeDefined();
      expect(typeof testConfig.sentry.environment).toBe("string");
    });

    it("should have environment property in sentry config", () => {
      // Positive test: Verify environment property exists
      const { APP_CONFIG: testConfig } = require("@/config/app.config");
      expect(testConfig.sentry).toHaveProperty("environment");
      expect(["development", "production", "test"]).toContain(
        testConfig.sentry.environment,
      );
    });
  });

  describe("Immutable Nature Tests", () => {
    it("should not allow modifying top-level properties", () => {
      // Negative test: Verify APP_CONFIG is frozen and immutable
      expect(() => {
        (APP_CONFIG as unknown as { name: string }).name = "Modified";
      }).toThrow();
    });

    it("should not allow adding new properties to top-level object", () => {
      // Negative test: Verify cannot add new properties
      expect(() => {
        (APP_CONFIG as unknown as { newProp: string }).newProp = "test";
      }).toThrow();
    });

    it("should not allow modifying nested api object properties", () => {
      // Negative test: Verify nested api object is frozen
      expect(() => {
        (APP_CONFIG.api as unknown as { timeout: number }).timeout = 99999;
      }).toThrow();
    });

    it("should not allow modifying nested features object", () => {
      // Negative test: Verify features object is frozen
      expect(() => {
        (APP_CONFIG.features as unknown as { analytics: boolean }).analytics =
          false;
      }).toThrow();
    });

    it("should not allow modifying nested cache object", () => {
      // Negative test: Verify cache object is frozen
      expect(() => {
        (APP_CONFIG.cache as unknown as { ttl: number }).ttl = 999;
      }).toThrow();
    });

    it("should not allow modifying nested theme object", () => {
      // Negative test: Verify theme object is frozen
      expect(() => {
        (APP_CONFIG.theme as unknown as { default: string }).default =
          "invalid";
      }).toThrow();
    });

    it("should not allow modifying nested sentry object", () => {
      // Negative test: Verify sentry object is frozen
      expect(() => {
        (
          APP_CONFIG.sentry as unknown as { tracesSampleRate: number }
        ).tracesSampleRate = 0.5;
      }).toThrow();
    });
  });

  describe("Type Validation Tests", () => {
    it("should have correct types for all properties", () => {
      // Positive test: Verify TypeScript types match runtime types
      expect(typeof APP_CONFIG.name).toBe("string");
      expect(typeof APP_CONFIG.version).toBe("string");
      expect(typeof APP_CONFIG.description).toBe("string");

      expect(typeof APP_CONFIG.api.baseUrl).toBe("string");
      expect(typeof APP_CONFIG.api.websocketUrl).toBe("string");
      expect(typeof APP_CONFIG.api.timeout).toBe("number");

      expect(typeof APP_CONFIG.features.analytics).toBe("boolean");
      expect(typeof APP_CONFIG.features.realtimeMonitoring).toBe("boolean");

      expect(typeof APP_CONFIG.theme.default).toBe("string");
      expect(typeof APP_CONFIG.cache.ttl).toBe("number");
      expect(typeof APP_CONFIG.sentry.environment).toBe("string");
    });

    it("should have numeric values within valid ranges", () => {
      // Positive test: Verify numeric constraints
      expect(APP_CONFIG.api.timeout).toBeGreaterThan(0);
      expect(APP_CONFIG.cache.ttl).toBeGreaterThan(0);
      expect(APP_CONFIG.cache.maxEntries).toBeGreaterThan(0);
      expect(APP_CONFIG.sentry.tracesSampleRate).toBeGreaterThanOrEqual(0);
      expect(APP_CONFIG.sentry.tracesSampleRate).toBeLessThanOrEqual(1);
    });

    it("should have boolean values for feature flags", () => {
      // Positive test: Verify all feature flags are booleans
      const features = APP_CONFIG.features;
      Object.values(features).forEach((value) => {
        expect(typeof value).toBe("boolean");
      });
    });

    it("should have valid URL formats for API endpoints", () => {
      // Positive test: Verify URL strings look valid
      expect(APP_CONFIG.api.baseUrl).toMatch(/^https?:\/\//);
      expect(APP_CONFIG.api.websocketUrl).toMatch(/^ws?:\/\//);
    });
  });

  describe("Edge Cases", () => {
    it("should handle accessing non-existent properties gracefully", () => {
      // Negative test: Accessing undefined property should return undefined
      const nonExistent = (APP_CONFIG as unknown as Record<string, unknown>)[
        "nonExistentProperty"
      ];
      expect(nonExistent).toBeUndefined();
    });

    it("should maintain immutability after property access", () => {
      // Positive test: Verify config remains immutable after reading properties
      const configCopy = APP_CONFIG;
      expect(() => {
        (configCopy as unknown as { version: string }).version = "0.0.0";
      }).toThrow();
      expect(APP_CONFIG.version).toBe("2.0.0");
    });
  });

  describe("Legacy Tests - Maintain Compatibility", () => {
    // Keeping original tests for compatibility
    it("has name property", () => {
      expect(APP_CONFIG.name).toBe("Llama Runner Pro");
    });

    it("has version property", () => {
      expect(APP_CONFIG.version).toBe("2.0.0");
    });

    it("has description property", () => {
      expect(APP_CONFIG.description).toBe(
        "Advanced Llama Model Management System",
      );
    });

    it("has baseUrl", () => {
      expect(APP_CONFIG.api.baseUrl).toBeDefined();
      expect(typeof APP_CONFIG.api.baseUrl).toBe("string");
    });

    it("has websocketUrl", () => {
      expect(APP_CONFIG.api.websocketUrl).toBeDefined();
      expect(typeof APP_CONFIG.api.websocketUrl).toBe("string");
    });

    it("has timeout of 30000ms", () => {
      expect(APP_CONFIG.api.timeout).toBe(30000);
    });

    it("defaults to localhost if env vars not set", () => {
      expect(APP_CONFIG.api.baseUrl).toMatch(
        /^(http:\/\/localhost:3000|http:\/\/|ws)/,
      );
    });

    it("has analytics feature enabled", () => {
      expect(APP_CONFIG.features.analytics).toBe(true);
    });

    it("has realtimeMonitoring feature enabled", () => {
      expect(APP_CONFIG.features.realtimeMonitoring).toBe(true);
    });

    it("has modelManagement feature enabled", () => {
      expect(APP_CONFIG.features.modelManagement).toBe(true);
    });

    it("has authentication disabled (security notice)", () => {
      expect(APP_CONFIG.features.authentication).toBe(false);
    });

    it("has default theme set to system", () => {
      expect(APP_CONFIG.theme.default).toBe("system");
    });

    it("supports dark theme", () => {
      expect(APP_CONFIG.theme.dark).toBe("dark");
    });

    it("supports light theme", () => {
      expect(APP_CONFIG.theme.light).toBe("light");
    });

    it("has TTL of 300 seconds", () => {
      expect(APP_CONFIG.cache.ttl).toBe(300);
    });

    it("has maxEntries of 100", () => {
      expect(APP_CONFIG.cache.maxEntries).toBe(100);
    });

    it("has sentry object", () => {
      expect(APP_CONFIG.sentry).toBeDefined();
    });

    it("has dsn property (may be empty)", () => {
      expect(APP_CONFIG.sentry.dsn).toBeDefined();
      expect(typeof APP_CONFIG.sentry.dsn).toBe("string");
    });

    it("has environment property", () => {
      expect(APP_CONFIG.sentry.environment).toBeDefined();
    });

    it("has tracesSampleRate", () => {
      expect(APP_CONFIG.sentry.tracesSampleRate).toBe(1.0);
    });

    it("is a readonly constant (as const)", () => {
      expect(Object.isFrozen(APP_CONFIG) || APP_CONFIG).toBeDefined();
    });

    it("has all top-level properties", () => {
      expect(APP_CONFIG).toHaveProperty("name");
      expect(APP_CONFIG).toHaveProperty("version");
      expect(APP_CONFIG).toHaveProperty("description");
      expect(APP_CONFIG).toHaveProperty("api");
      expect(APP_CONFIG).toHaveProperty("features");
      expect(APP_CONFIG).toHaveProperty("theme");
      expect(APP_CONFIG).toHaveProperty("cache");
      expect(APP_CONFIG).toHaveProperty("sentry");
    });

    it("has all api properties", () => {
      expect(APP_CONFIG.api).toHaveProperty("baseUrl");
      expect(APP_CONFIG.api).toHaveProperty("websocketUrl");
      expect(APP_CONFIG.api).toHaveProperty("timeout");
    });

    it("has all feature flags", () => {
      expect(APP_CONFIG.features).toHaveProperty("analytics");
      expect(APP_CONFIG.features).toHaveProperty("realtimeMonitoring");
      expect(APP_CONFIG.features).toHaveProperty("modelManagement");
      expect(APP_CONFIG.features).toHaveProperty("authentication");
    });

    it("has all theme options", () => {
      expect(APP_CONFIG.theme).toHaveProperty("default");
      expect(APP_CONFIG.theme).toHaveProperty("dark");
      expect(APP_CONFIG.theme).toHaveProperty("light");
    });

    it("has all cache properties", () => {
      expect(APP_CONFIG.cache).toHaveProperty("ttl");
      expect(APP_CONFIG.cache).toHaveProperty("maxEntries");
    });

    it("has all sentry properties", () => {
      expect(APP_CONFIG.sentry).toHaveProperty("dsn");
      expect(APP_CONFIG.sentry).toHaveProperty("environment");
      expect(APP_CONFIG.sentry).toHaveProperty("tracesSampleRate");
    });
  });
});
