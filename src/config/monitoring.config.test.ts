import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { MONITORING_CONFIG, MonitoringConfig } from "../monitoring.config";

describe("MonitoringConfig", () => {
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
      expect(MONITORING_CONFIG).toBeDefined();
      expect(typeof MONITORING_CONFIG).toBe("object");
    });

    it("should have correct type", () => {
      const config: MonitoringConfig = MONITORING_CONFIG;
      expect(config).toBeDefined();
    });
  });

  describe("REQUIRE_REAL_DATA Configuration", () => {
    it("should require real data in production mode", () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const { MONITORING_CONFIG: reloadedConfig } = require("../monitoring.config");
      expect(reloadedConfig.REQUIRE_REAL_DATA).toBe(true);
    });

    it("should not require real data in development mode", () => {
      process.env.NODE_ENV = "development";
      jest.resetModules();
      const { MONITORING_CONFIG: reloadedConfig } = require("../monitoring.config");
      expect(reloadedConfig.REQUIRE_REAL_DATA).toBe(false);
    });

    it("should not require real data in test mode", () => {
      process.env.NODE_ENV = "test";
      jest.resetModules();
      const { MONITORING_CONFIG: reloadedConfig } = require("../monitoring.config");
      expect(reloadedConfig.REQUIRE_REAL_DATA).toBe(false);
    });

    it("should be a boolean value", () => {
      expect(typeof MONITORING_CONFIG.REQUIRE_REAL_DATA).toBe("boolean");
    });
  });

  describe("WEBSOCKET Configuration", () => {
    it("should have WEBSOCKET configuration object", () => {
      expect(MONITORING_CONFIG.WEBSOCKET).toBeDefined();
      expect(typeof MONITORING_CONFIG.WEBSOCKET).toBe("object");
    });

    it("should have CONNECTION_TIMEOUT", () => {
      expect(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBe(15000);
      expect(typeof MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBe("number");
    });

    it("should have AUTO_RECONNECT enabled", () => {
      expect(MONITORING_CONFIG.WEBSOCKET.AUTO_RECONNECT).toBe(true);
      expect(typeof MONITORING_CONFIG.WEBSOCKET.AUTO_RECONNECT).toBe("boolean");
    });

    it("should have MAX_RECONNECT_ATTEMPTS", () => {
      expect(MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).toBe(5);
      expect(typeof MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).toBe("number");
    });

    it("should have RECONNECT_DELAY", () => {
      expect(MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY).toBe(3000);
      expect(typeof MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY).toBe("number");
    });
  });

  describe("MOCK_DATA Configuration", () => {
    it("should have MOCK_DATA configuration object", () => {
      expect(MONITORING_CONFIG.MOCK_DATA).toBeDefined();
      expect(typeof MONITORING_CONFIG.MOCK_DATA).toBe("object");
    });

    it("should have ENABLE_FALLBACK", () => {
      expect(typeof MONITORING_CONFIG.MOCK_DATA.ENABLE_FALLBACK).toBe("boolean");
    });

    it("should enable mock fallback in development", () => {
      process.env.NODE_ENV = "development";
      jest.resetModules();
      const { MONITORING_CONFIG: reloadedConfig } = require("../monitoring.config");
      expect(reloadedConfig.MOCK_DATA.ENABLE_FALLBACK).toBe(true);
    });

    it("should disable mock fallback in production", () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const { MONITORING_CONFIG: reloadedConfig } = require("../monitoring.config");
      expect(reloadedConfig.MOCK_DATA.ENABLE_FALLBACK).toBe(false);
    });

    it("should have UPDATE_INTERVAL", () => {
      expect(MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBe(5000);
      expect(typeof MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBe("number");
    });

    it("should have GPU configuration", () => {
      expect(MONITORING_CONFIG.MOCK_DATA.GPU).toBeDefined();
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU).toBe("object");
    });

    it("should have GPU NAME", () => {
      expect(MONITORING_CONFIG.MOCK_DATA.GPU.NAME).toBe("NVIDIA RTX 4090");
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.NAME).toBe("string");
    });

    it("should have GPU MEMORY_TOTAL_MB", () => {
      expect(MONITORING_CONFIG.MOCK_DATA.GPU.MEMORY_TOTAL_MB).toBe(24576);
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.MEMORY_TOTAL_MB).toBe("number");
    });

    it("should have correct GPU memory value (24GB)", () => {
      expect(MONITORING_CONFIG.MOCK_DATA.GPU.MEMORY_TOTAL_MB).toBe(24576);
    });

    it("should have GPU POWER_LIMIT_W", () => {
      expect(MONITORING_CONFIG.MOCK_DATA.GPU.POWER_LIMIT_W).toBe(350);
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.POWER_LIMIT_W).toBe("number");
    });
  });

  describe("UI Configuration", () => {
    it("should have UI configuration object", () => {
      expect(MONITORING_CONFIG.UI).toBeDefined();
      expect(typeof MONITORING_CONFIG.UI).toBe("object");
    });

    it("should have SHOW_CONNECTION_STATUS enabled", () => {
      expect(MONITORING_CONFIG.UI.SHOW_CONNECTION_STATUS).toBe(true);
      expect(typeof MONITORING_CONFIG.UI.SHOW_CONNECTION_STATUS).toBe("boolean");
    });

    it("should have DISCONNECTED_ANIMATION enabled", () => {
      expect(MONITORING_CONFIG.UI.DISCONNECTED_ANIMATION).toBe(true);
      expect(typeof MONITORING_CONFIG.UI.DISCONNECTED_ANIMATION).toBe("boolean");
    });

    it("should have ERROR_DISPLAY_DURATION", () => {
      expect(MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBe(10000);
      expect(typeof MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBe("number");
    });
  });

  describe("Type Safety", () => {
    it("should have correct types for all properties", () => {
      expect(typeof MONITORING_CONFIG.REQUIRE_REAL_DATA).toBe("boolean");
      expect(typeof MONITORING_CONFIG.WEBSOCKET).toBe("object");
      expect(typeof MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBe("number");
      expect(typeof MONITORING_CONFIG.WEBSOCKET.AUTO_RECONNECT).toBe("boolean");
      expect(typeof MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).toBe("number");
      expect(typeof MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY).toBe("number");
      expect(typeof MONITORING_CONFIG.MOCK_DATA).toBe("object");
      expect(typeof MONITORING_CONFIG.MOCK_DATA.ENABLE_FALLBACK).toBe("boolean");
      expect(typeof MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBe("number");
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU).toBe("object");
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.NAME).toBe("string");
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.MEMORY_TOTAL_MB).toBe("number");
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.POWER_LIMIT_W).toBe("number");
      expect(typeof MONITORING_CONFIG.UI).toBe("object");
      expect(typeof MONITORING_CONFIG.UI.SHOW_CONNECTION_STATUS).toBe("boolean");
      expect(typeof MONITORING_CONFIG.UI.DISCONNECTED_ANIMATION).toBe("boolean");
      expect(typeof MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBe("number");
    });
  });

  describe("Configuration Completeness", () => {
    it("should have all expected top-level properties", () => {
      const expectedKeys = ["REQUIRE_REAL_DATA", "WEBSOCKET", "MOCK_DATA", "UI"];
      expectedKeys.forEach((key) => {
        expect(MONITORING_CONFIG).toHaveProperty(key);
      });
    });

    it("should have all expected WEBSOCKET properties", () => {
      const expectedKeys = [
        "CONNECTION_TIMEOUT",
        "AUTO_RECONNECT",
        "MAX_RECONNECT_ATTEMPTS",
        "RECONNECT_DELAY"
      ];
      expectedKeys.forEach((key) => {
        expect(MONITORING_CONFIG.WEBSOCKET).toHaveProperty(key);
      });
    });

    it("should have all expected MOCK_DATA properties", () => {
      const expectedKeys = [
        "ENABLE_FALLBACK",
        "UPDATE_INTERVAL",
        "GPU"
      ];
      expectedKeys.forEach((key) => {
        expect(MONITORING_CONFIG.MOCK_DATA).toHaveProperty(key);
      });
    });

    it("should have all expected GPU properties", () => {
      const expectedKeys = [
        "NAME",
        "MEMORY_TOTAL_MB",
        "POWER_LIMIT_W"
      ];
      expectedKeys.forEach((key) => {
        expect(MONITORING_CONFIG.MOCK_DATA.GPU).toHaveProperty(key);
      });
    });

    it("should have all expected UI properties", () => {
      const expectedKeys = [
        "SHOW_CONNECTION_STATUS",
        "DISCONNECTED_ANIMATION",
        "ERROR_DISPLAY_DURATION"
      ];
      expectedKeys.forEach((key) => {
        expect(MONITORING_CONFIG.UI).toHaveProperty(key);
      });
    });
  });

  describe("Configuration Values", () => {
    it("should have reasonable WebSocket timeout (15s)", () => {
      expect(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBeGreaterThan(10000);
      expect(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBeLessThan(30000);
    });

    it("should have reasonable reconnect attempts (5)", () => {
      expect(MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).toBe(5);
    });

    it("should have reasonable reconnect delay (3s)", () => {
      expect(MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY).toBe(3000);
    });

    it("should have reasonable mock update interval (5s)", () => {
      expect(MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBe(5000);
    });

    it("should have reasonable error display duration (10s)", () => {
      expect(MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBe(10000);
    });
  });

  describe("Environment-Specific Behavior", () => {
    it("should disable mock data fallback in production while requiring real data", () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const { MONITORING_CONFIG: reloadedConfig } = require("../monitoring.config");
      expect(reloadedConfig.REQUIRE_REAL_DATA).toBe(true);
      expect(reloadedConfig.MOCK_DATA.ENABLE_FALLBACK).toBe(false);
    });

    it("should enable mock data fallback in non-production while not requiring real data", () => {
      process.env.NODE_ENV = "development";
      jest.resetModules();
      const { MONITORING_CONFIG: reloadedConfig } = require("../monitoring.config");
      expect(reloadedConfig.REQUIRE_REAL_DATA).toBe(false);
      expect(reloadedConfig.MOCK_DATA.ENABLE_FALLBACK).toBe(true);
    });
  });
});
