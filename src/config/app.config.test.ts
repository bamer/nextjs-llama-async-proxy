import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { APP_CONFIG, AppConfig } from "@/config/app.config";

describe("AppConfig", () => {
  // Store original environment variables
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe("Basic Structure", () => {
    it("should be defined", () => {
      expect(APP_CONFIG).toBeDefined();
      expect(typeof APP_CONFIG).toBe("object");
    });

    it("should have correct type", () => {
      const config: AppConfig = APP_CONFIG;
      expect(config).toBeDefined();
    });

    it("should be a const object (frozen properties)", () => {
      expect(Object.isFrozen(APP_CONFIG)).toBe(true);
    });
  });

  describe("Metadata", () => {
    it("should have correct app name", () => {
      expect(APP_CONFIG.name).toBe("Llama Runner Pro");
    });

    it("should have correct version", () => {
      expect(APP_CONFIG.version).toBe("2.0.0");
    });

    it("should have correct description", () => {
      expect(APP_CONFIG.description).toBe("Advanced Llama Model Management System");
    });
  });

  describe("API Configuration", () => {
    it("should have API configuration object", () => {
      expect(APP_CONFIG.api).toBeDefined();
      expect(typeof APP_CONFIG.api).toBe("object");
    });

    it("should use default baseUrl when NEXT_PUBLIC_API_URL is not set", () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      // Note: Since APP_CONFIG is evaluated at import time, we need to re-import
      jest.resetModules();
      const { APP_CONFIG: reloadedConfig } = require("../app.config");
      expect(reloadedConfig.api.baseUrl).toBe("http://localhost:3000");
    });

    it("should use custom baseUrl from NEXT_PUBLIC_API_URL", () => {
      process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
      jest.resetModules();
      const { APP_CONFIG: reloadedConfig } = require("../app.config");
      expect(reloadedConfig.api.baseUrl).toBe("https://api.example.com");
    });

    it("should use default websocketUrl when NEXT_PUBLIC_WS_URL is not set", () => {
      delete process.env.NEXT_PUBLIC_WS_URL;
      jest.resetModules();
      const { APP_CONFIG: reloadedConfig } = require("../app.config");
      expect(reloadedConfig.api.websocketUrl).toBe("ws://localhost:3000");
    });

    it("should use custom websocketUrl from NEXT_PUBLIC_WS_URL", () => {
      process.env.NEXT_PUBLIC_WS_URL = "wss://ws.example.com";
      jest.resetModules();
      const { APP_CONFIG: reloadedConfig } = require("../app.config");
      expect(reloadedConfig.api.websocketUrl).toBe("wss://ws.example.com");
    });

    it("should have correct timeout value", () => {
      expect(APP_CONFIG.api.timeout).toBe(30000);
    });
  });

  describe("Feature Flags", () => {
    it("should have features configuration object", () => {
      expect(APP_CONFIG.features).toBeDefined();
      expect(typeof APP_CONFIG.features).toBe("object");
    });

    it("should have analytics enabled", () => {
      expect(APP_CONFIG.features.analytics).toBe(true);
    });

    it("should have realtimeMonitoring enabled", () => {
      expect(APP_CONFIG.features.realtimeMonitoring).toBe(true);
    });

    it("should have modelManagement enabled", () => {
      expect(APP_CONFIG.features.modelManagement).toBe(true);
    });

    it("should have authentication disabled", () => {
      expect(APP_CONFIG.features.authentication).toBe(false);
    });
  });

  describe("Theme Configuration", () => {
    it("should have theme configuration object", () => {
      expect(APP_CONFIG.theme).toBeDefined();
      expect(typeof APP_CONFIG.theme).toBe("object");
    });

    it("should have default theme set to system", () => {
      expect(APP_CONFIG.theme.default).toBe("system");
    });

    it("should have dark theme value", () => {
      expect(APP_CONFIG.theme.dark).toBe("dark");
    });

    it("should have light theme value", () => {
      expect(APP_CONFIG.theme.light).toBe("light");
    });
  });

  describe("Cache Configuration", () => {
    it("should have cache configuration object", () => {
      expect(APP_CONFIG.cache).toBeDefined();
      expect(typeof APP_CONFIG.cache).toBe("object");
    });

    it("should have correct TTL value", () => {
      expect(APP_CONFIG.cache.ttl).toBe(300);
    });

    it("should have correct maxEntries value", () => {
      expect(APP_CONFIG.cache.maxEntries).toBe(100);
    });
  });

  describe("Sentry Configuration", () => {
    it("should have sentry configuration object", () => {
      expect(APP_CONFIG.sentry).toBeDefined();
      expect(typeof APP_CONFIG.sentry).toBe("object");
    });

    it("should have empty DSN by default", () => {
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      jest.resetModules();
      const { APP_CONFIG: reloadedConfig } = require("../app.config");
      expect(reloadedConfig.sentry.dsn).toBe("");
    });

    it("should use custom DSN from NEXT_PUBLIC_SENTRY_DSN", () => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://sentry.example.com/dsn";
      jest.resetModules();
      const { APP_CONFIG: reloadedConfig } = require("../app.config");
      expect(reloadedConfig.sentry.dsn).toBe("https://sentry.example.com/dsn");
    });

    it("should use development environment by default", () => {
      delete process.env.NODE_ENV;
      jest.resetModules();
      const { APP_CONFIG: reloadedConfig } = require("../app.config");
      expect(reloadedConfig.sentry.environment).toBe("development");
    });

    it("should use production environment when NODE_ENV is production", () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const { APP_CONFIG: reloadedConfig } = require("../app.config");
      expect(reloadedConfig.sentry.environment).toBe("production");
    });

    it("should have correct tracesSampleRate", () => {
      expect(APP_CONFIG.sentry.tracesSampleRate).toBe(1.0);
    });
  });

  describe("Immutability", () => {
    it("should not allow modification of config values", () => {
      // @ts-expect-error - Testing immutability
      expect(() => { APP_CONFIG.name = "Modified"; }).toThrow();
    });
  });

  describe("Type Safety", () => {
    it("should have correct TypeScript types for all properties", () => {
      expect(typeof APP_CONFIG.name).toBe("string");
      expect(typeof APP_CONFIG.version).toBe("string");
      expect(typeof APP_CONFIG.description).toBe("string");
      expect(typeof APP_CONFIG.api).toBe("object");
      expect(typeof APP_CONFIG.api.baseUrl).toBe("string");
      expect(typeof APP_CONFIG.api.websocketUrl).toBe("string");
      expect(typeof APP_CONFIG.api.timeout).toBe("number");
      expect(typeof APP_CONFIG.features).toBe("object");
      expect(typeof APP_CONFIG.features.analytics).toBe("boolean");
      expect(typeof APP_CONFIG.features.realtimeMonitoring).toBe("boolean");
      expect(typeof APP_CONFIG.features.modelManagement).toBe("boolean");
      expect(typeof APP_CONFIG.features.authentication).toBe("boolean");
      expect(typeof APP_CONFIG.theme).toBe("object");
      expect(typeof APP_CONFIG.theme.default).toBe("string");
      expect(typeof APP_CONFIG.theme.dark).toBe("string");
      expect(typeof APP_CONFIG.theme.light).toBe("string");
      expect(typeof APP_CONFIG.cache).toBe("object");
      expect(typeof APP_CONFIG.cache.ttl).toBe("number");
      expect(typeof APP_CONFIG.cache.maxEntries).toBe("number");
      expect(typeof APP_CONFIG.sentry).toBe("object");
      expect(typeof APP_CONFIG.sentry.dsn).toBe("string");
      expect(typeof APP_CONFIG.sentry.environment).toBe("string");
      expect(typeof APP_CONFIG.sentry.tracesSampleRate).toBe("number");
    });
  });
});
