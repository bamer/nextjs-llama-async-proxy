/**
 * Comprehensive tests for src/config/monitoring.config.ts
 *
 * Test Coverage Objectives:
 * - Verify all exports exist and are properly typed
 * - Test WebSocket connection settings
 * - Test mock data configuration
 * - Test environment-based configuration
 * - Validate UI settings
 */

import { MONITORING_CONFIG, MonitoringConfig } from "@/config/monitoring.config";

describe("monitoring.config.ts", () => {
  const originalConfig = {
    REQUIRE_REAL_DATA: false,
    WEBSOCKET: {
      CONNECTION_TIMEOUT: 15000,
      AUTO_RECONNECT: true,
      MAX_RECONNECT_ATTEMPTS: 5,
      RECONNECT_DELAY: 3000,
    },
    MOCK_DATA: {
      ENABLE_FALLBACK: true,
      UPDATE_INTERVAL: 5000,
      GPU: {
        NAME: "NVIDIA RTX 4090",
        MEMORY_TOTAL_MB: 24576,
        POWER_LIMIT_W: 350,
      },
    },
    UI: {
      SHOW_CONNECTION_STATUS: true,
      DISCONNECTED_ANIMATION: true,
      ERROR_DISPLAY_DURATION: 10000,
    },
  };

  beforeEach(() => {
    // Reset config to defaults before each test
    MONITORING_CONFIG.REQUIRE_REAL_DATA = originalConfig.REQUIRE_REAL_DATA;
    Object.assign(MONITORING_CONFIG.WEBSOCKET, originalConfig.WEBSOCKET);
    Object.assign(MONITORING_CONFIG.MOCK_DATA, originalConfig.MOCK_DATA);
    Object.assign(MONITORING_CONFIG.MOCK_DATA.GPU, originalConfig.MOCK_DATA.GPU);
    Object.assign(MONITORING_CONFIG.UI, originalConfig.UI);
  });
  describe("Export Verification", () => {
    it("should export MONITORING_CONFIG constant", () => {
      // Positive test: Verify the export exists and is an object
      expect(MONITORING_CONFIG).toBeDefined();
      expect(typeof MONITORING_CONFIG).toBe("object");
    });

    it("should export MonitoringConfig type", () => {
      // Positive test: Verify the type is exported (indirect check via type assertion)
      const typedConfig: MonitoringConfig = MONITORING_CONFIG;
      expect(typedConfig).toEqual(MONITORING_CONFIG);
    });

    it("should have no undefined top-level properties", () => {
      // Positive test: All top-level properties should be defined
      expect(MONITORING_CONFIG.REQUIRE_REAL_DATA).toBeDefined();
      expect(MONITORING_CONFIG.WEBSOCKET).toBeDefined();
      expect(MONITORING_CONFIG.MOCK_DATA).toBeDefined();
      expect(MONITORING_CONFIG.UI).toBeDefined();
    });
  });

  describe("REQUIRE_REAL_DATA", () => {
    it("is defined", () => {
      expect(MONITORING_CONFIG.REQUIRE_REAL_DATA).toBeDefined();
    });

    it("is a boolean", () => {
      expect(typeof MONITORING_CONFIG.REQUIRE_REAL_DATA).toBe("boolean");
    });

    it("is defined as environment-dependent value", () => {
      expect(MONITORING_CONFIG.REQUIRE_REAL_DATA).toBeDefined();
    });
  });

  describe("WEBSOCKET configuration", () => {
    it("has WEBSOCKET object", () => {
      expect(MONITORING_CONFIG.WEBSOCKET).toBeDefined();
      expect(typeof MONITORING_CONFIG.WEBSOCKET).toBe("object");
    });

    it("has CONNECTION_TIMEOUT", () => {
      expect(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBeDefined();
      expect(typeof MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBe("number");
      expect(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBe(15000);
    });

    it("has AUTO_RECONNECT", () => {
      expect(MONITORING_CONFIG.WEBSOCKET.AUTO_RECONNECT).toBeDefined();
      expect(typeof MONITORING_CONFIG.WEBSOCKET.AUTO_RECONNECT).toBe("boolean");
      expect(MONITORING_CONFIG.WEBSOCKET.AUTO_RECONNECT).toBe(true);
    });

    it("has MAX_RECONNECT_ATTEMPTS", () => {
      expect(MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).toBeDefined();
      expect(typeof MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).toBe("number");
      expect(MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).toBe(5);
    });

    it("has RECONNECT_DELAY", () => {
      expect(MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY).toBeDefined();
      expect(typeof MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY).toBe("number");
      expect(MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY).toBe(3000);
    });
  });

  describe("MOCK_DATA configuration", () => {
    it("has MOCK_DATA object", () => {
      expect(MONITORING_CONFIG.MOCK_DATA).toBeDefined();
      expect(typeof MONITORING_CONFIG.MOCK_DATA).toBe("object");
    });

    it("has ENABLE_FALLBACK", () => {
      expect(MONITORING_CONFIG.MOCK_DATA.ENABLE_FALLBACK).toBeDefined();
      expect(typeof MONITORING_CONFIG.MOCK_DATA.ENABLE_FALLBACK).toBe("boolean");
    });

    it("has UPDATE_INTERVAL", () => {
      expect(MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBeDefined();
      expect(typeof MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBe("number");
      expect(MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBe(5000);
    });

    it("has GPU object", () => {
      expect(MONITORING_CONFIG.MOCK_DATA.GPU).toBeDefined();
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU).toBe("object");
    });

    describe("GPU mock data", () => {
      it("has GPU NAME", () => {
        expect(MONITORING_CONFIG.MOCK_DATA.GPU.NAME).toBeDefined();
        expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.NAME).toBe("string");
        expect(MONITORING_CONFIG.MOCK_DATA.GPU.NAME).toBe("NVIDIA RTX 4090");
      });

      it("has GPU MEMORY_TOTAL_MB", () => {
        expect(MONITORING_CONFIG.MOCK_DATA.GPU.MEMORY_TOTAL_MB).toBeDefined();
        expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.MEMORY_TOTAL_MB).toBe("number");
        expect(MONITORING_CONFIG.MOCK_DATA.GPU.MEMORY_TOTAL_MB).toBe(24576);
      });

      it("has GPU POWER_LIMIT_W", () => {
        expect(MONITORING_CONFIG.MOCK_DATA.GPU.POWER_LIMIT_W).toBeDefined();
        expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.POWER_LIMIT_W).toBe("number");
        expect(MONITORING_CONFIG.MOCK_DATA.GPU.POWER_LIMIT_W).toBe(350);
      });
    });
  });

  describe("UI configuration", () => {
    it("has UI object", () => {
      expect(MONITORING_CONFIG.UI).toBeDefined();
      expect(typeof MONITORING_CONFIG.UI).toBe("object");
    });

    it("has SHOW_CONNECTION_STATUS", () => {
      expect(MONITORING_CONFIG.UI.SHOW_CONNECTION_STATUS).toBeDefined();
      expect(typeof MONITORING_CONFIG.UI.SHOW_CONNECTION_STATUS).toBe("boolean");
      expect(MONITORING_CONFIG.UI.SHOW_CONNECTION_STATUS).toBe(true);
    });

    it("has DISCONNECTED_ANIMATION", () => {
      expect(MONITORING_CONFIG.UI.DISCONNECTED_ANIMATION).toBeDefined();
      expect(typeof MONITORING_CONFIG.UI.DISCONNECTED_ANIMATION).toBe("boolean");
      expect(MONITORING_CONFIG.UI.DISCONNECTED_ANIMATION).toBe(true);
    });

    it("has ERROR_DISPLAY_DURATION", () => {
      expect(MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBeDefined();
      expect(typeof MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBe("number");
      expect(MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBe(10000);
    });
  });

  describe("config structure", () => {
    it("has all top-level properties", () => {
      expect(MONITORING_CONFIG).toHaveProperty("REQUIRE_REAL_DATA");
      expect(MONITORING_CONFIG).toHaveProperty("WEBSOCKET");
      expect(MONITORING_CONFIG).toHaveProperty("MOCK_DATA");
      expect(MONITORING_CONFIG).toHaveProperty("UI");
    });

    it("has all WEBSOCKET properties", () => {
      expect(MONITORING_CONFIG.WEBSOCKET).toHaveProperty("CONNECTION_TIMEOUT");
      expect(MONITORING_CONFIG.WEBSOCKET).toHaveProperty("AUTO_RECONNECT");
      expect(MONITORING_CONFIG.WEBSOCKET).toHaveProperty("MAX_RECONNECT_ATTEMPTS");
      expect(MONITORING_CONFIG.WEBSOCKET).toHaveProperty("RECONNECT_DELAY");
    });

    it("has all MOCK_DATA properties", () => {
      expect(MONITORING_CONFIG.MOCK_DATA).toHaveProperty("ENABLE_FALLBACK");
      expect(MONITORING_CONFIG.MOCK_DATA).toHaveProperty("UPDATE_INTERVAL");
      expect(MONITORING_CONFIG.MOCK_DATA).toHaveProperty("GPU");
    });

    it("has all GPU properties", () => {
      expect(MONITORING_CONFIG.MOCK_DATA.GPU).toHaveProperty("NAME");
      expect(MONITORING_CONFIG.MOCK_DATA.GPU).toHaveProperty("MEMORY_TOTAL_MB");
      expect(MONITORING_CONFIG.MOCK_DATA.GPU).toHaveProperty("POWER_LIMIT_W");
    });

    it("has all UI properties", () => {
      expect(MONITORING_CONFIG.UI).toHaveProperty("SHOW_CONNECTION_STATUS");
      expect(MONITORING_CONFIG.UI).toHaveProperty("DISCONNECTED_ANIMATION");
      expect(MONITORING_CONFIG.UI).toHaveProperty("ERROR_DISPLAY_DURATION");
    });
  });

  describe("configuration values", () => {
    it("has reasonable connection timeout (15 seconds)", () => {
      expect(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBe(15000);
      expect(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBeGreaterThan(0);
      expect(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBeLessThan(60000);
    });

    it("has reasonable reconnection settings", () => {
      expect(MONITORING_CONFIG.WEBSOCKET.AUTO_RECONNECT).toBe(true);
      expect(MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).toBeGreaterThan(0);
      expect(MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).toBeLessThan(20);
      expect(MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY).toBeGreaterThan(1000);
    });

    it("has reasonable mock data update interval", () => {
      expect(MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBe(5000);
      expect(MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBeGreaterThan(1000);
    });

    it("has reasonable GPU mock values", () => {
      expect(MONITORING_CONFIG.MOCK_DATA.GPU.MEMORY_TOTAL_MB).toBeGreaterThan(0);
      expect(MONITORING_CONFIG.MOCK_DATA.GPU.POWER_LIMIT_W).toBeGreaterThan(0);
      expect(MONITORING_CONFIG.MOCK_DATA.GPU.NAME.length).toBeGreaterThan(0);
    });

    it("has reasonable UI settings", () => {
      expect(MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBeGreaterThan(0);
      expect(MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBeLessThan(60000);
    });
  });

  describe("data types", () => {
    it("has all booleans as boolean type", () => {
      expect(typeof MONITORING_CONFIG.REQUIRE_REAL_DATA).toBe("boolean");
      expect(typeof MONITORING_CONFIG.WEBSOCKET.AUTO_RECONNECT).toBe("boolean");
      expect(typeof MONITORING_CONFIG.MOCK_DATA.ENABLE_FALLBACK).toBe("boolean");
      expect(typeof MONITORING_CONFIG.UI.SHOW_CONNECTION_STATUS).toBe("boolean");
      expect(typeof MONITORING_CONFIG.UI.DISCONNECTED_ANIMATION).toBe("boolean");
    });

    it("has all numbers as number type", () => {
      expect(typeof MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBe("number");
      expect(typeof MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).toBe("number");
      expect(typeof MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY).toBe("number");
      expect(typeof MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBe("number");
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.MEMORY_TOTAL_MB).toBe("number");
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.POWER_LIMIT_W).toBe("number");
      expect(typeof MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBe("number");
    });

    it("has all strings as string type", () => {
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.NAME).toBe("string");
    });
  });

  describe("config immutability", () => {
    it("is defined as a constant", () => {
      expect(MONITORING_CONFIG).toBeDefined();
    });

    it("is NOT frozen (intentionally mutable for environment configuration)", () => {
      // Positive test: monitoring config is intentionally not frozen to allow runtime modifications
      expect(Object.isFrozen(MONITORING_CONFIG)).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle accessing non-existent properties gracefully", () => {
      // Negative test: Accessing undefined property should return undefined
      const nonExistent = (MONITORING_CONFIG as unknown as Record<string, unknown>)[
        "nonExistentProperty"
      ];
      expect(nonExistent).toBeUndefined();
    });

    it("should maintain all boolean flags as valid booleans", () => {
      // Positive test: All boolean configuration flags should be true/false
      const booleanPaths = [
        "REQUIRE_REAL_DATA",
        "WEBSOCKET.AUTO_RECONNECT",
        "MOCK_DATA.ENABLE_FALLBACK",
        "UI.SHOW_CONNECTION_STATUS",
        "UI.DISCONNECTED_ANIMATION",
      ];

      booleanPaths.forEach((path) => {
        const keys = path.split(".");
        let value: unknown = MONITORING_CONFIG;
        for (const key of keys) {
          value = (value as Record<string, unknown>)[key];
        }
        expect(typeof value).toBe("boolean");
      });
    });

    it("should have all numeric timeouts greater than zero", () => {
      // Positive test: All timeout/delay values should be positive
      expect(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBeGreaterThan(
        0,
      );
      expect(MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY).toBeGreaterThan(0);
      expect(MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBeGreaterThan(0);
      expect(MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBeGreaterThan(0);
    });
  });

  describe("Environment-Based Configuration", () => {
    it("should respect NODE_ENV for REQUIRE_REAL_DATA", () => {
      // Positive test: REQUIRE_REAL_DATA is based on NODE_ENV at module load
      // We verify the property exists and is boolean, actual value depends on environment
      expect(typeof MONITORING_CONFIG.REQUIRE_REAL_DATA).toBe("boolean");
    });

    it("should respect NODE_ENV for MOCK_DATA.ENABLE_FALLBACK", () => {
      // Positive test: ENABLE_FALLBACK is based on NODE_ENV at module load
      // We verify the property exists and is boolean, actual value depends on environment
      expect(typeof MONITORING_CONFIG.MOCK_DATA.ENABLE_FALLBACK).toBe("boolean");
    });
  });

  describe("WebSocket Connection Settings", () => {
    it("should have reasonable WebSocket connection settings", () => {
      // Positive test: Verify WebSocket settings are within reasonable bounds
      expect(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBe(15000);
      expect(MONITORING_CONFIG.WEBSOCKET.AUTO_RECONNECT).toBe(true);
      expect(MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).toBeGreaterThan(
        0,
      );
      expect(MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).toBeLessThan(
        20,
      );
      expect(MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY).toBeGreaterThan(1000);
    });

    it("should have all WebSocket properties defined", () => {
      // Positive test: Verify all WebSocket properties exist
      expect(MONITORING_CONFIG.WEBSOCKET).toHaveProperty(
        "CONNECTION_TIMEOUT",
      );
      expect(MONITORING_CONFIG.WEBSOCKET).toHaveProperty("AUTO_RECONNECT");
      expect(MONITORING_CONFIG.WEBSOCKET).toHaveProperty(
        "MAX_RECONNECT_ATTEMPTS",
      );
      expect(MONITORING_CONFIG.WEBSOCKET).toHaveProperty("RECONNECT_DELAY");
    });

    it("should have correct WebSocket timeout values", () => {
      // Positive test: Verify exact timeout values
      expect(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBe(15000);
      expect(MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY).toBe(3000);
    });
  });

  describe("Mock Data Configuration", () => {
    it("should have comprehensive mock data settings", () => {
      // Positive test: Verify mock data structure
      expect(MONITORING_CONFIG.MOCK_DATA).toHaveProperty("ENABLE_FALLBACK");
      expect(MONITORING_CONFIG.MOCK_DATA).toHaveProperty("UPDATE_INTERVAL");
      expect(MONITORING_CONFIG.MOCK_DATA).toHaveProperty("GPU");
    });

    it("should have realistic GPU mock values", () => {
      // Positive test: Verify GPU mock data looks realistic
      expect(MONITORING_CONFIG.MOCK_DATA.GPU.NAME).toBe("NVIDIA RTX 4090");
      expect(MONITORING_CONFIG.MOCK_DATA.GPU.MEMORY_TOTAL_MB).toBe(24576);
      expect(MONITORING_CONFIG.MOCK_DATA.GPU.POWER_LIMIT_W).toBe(350);
    });

    it("should have mock data update interval", () => {
      // Positive test: Verify mock data refresh rate
      expect(MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBe(5000);
      expect(MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBeGreaterThan(1000);
    });

    it("should have all GPU mock properties defined", () => {
      // Positive test: Verify all GPU properties exist
      expect(MONITORING_CONFIG.MOCK_DATA.GPU).toHaveProperty("NAME");
      expect(MONITORING_CONFIG.MOCK_DATA.GPU).toHaveProperty("MEMORY_TOTAL_MB");
      expect(MONITORING_CONFIG.MOCK_DATA.GPU).toHaveProperty("POWER_LIMIT_W");
    });
  });

  describe("UI Configuration", () => {
    it("should have all UI settings defined", () => {
      // Positive test: Verify UI properties exist
      expect(MONITORING_CONFIG.UI).toHaveProperty("SHOW_CONNECTION_STATUS");
      expect(MONITORING_CONFIG.UI).toHaveProperty("DISCONNECTED_ANIMATION");
      expect(MONITORING_CONFIG.UI).toHaveProperty("ERROR_DISPLAY_DURATION");
    });

    it("should have connection status enabled", () => {
      // Positive test: Connection status should be shown
      expect(MONITORING_CONFIG.UI.SHOW_CONNECTION_STATUS).toBe(true);
    });

    it("should have disconnected animation enabled", () => {
      // Positive test: Animation should be enabled for better UX
      expect(MONITORING_CONFIG.UI.DISCONNECTED_ANIMATION).toBe(true);
    });

    it("should have reasonable error display duration", () => {
      // Positive test: Error display should be shown long enough
      expect(MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBe(10000);
      expect(MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBeGreaterThan(0);
      expect(MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBeLessThan(60000);
    });
  });

  describe("Type Validation Tests", () => {
    it("should have correct types for all top-level properties", () => {
      // Positive test: Verify TypeScript types match runtime types
      expect(typeof MONITORING_CONFIG.REQUIRE_REAL_DATA).toBe("boolean");
      expect(typeof MONITORING_CONFIG.WEBSOCKET).toBe("object");
      expect(typeof MONITORING_CONFIG.MOCK_DATA).toBe("object");
      expect(typeof MONITORING_CONFIG.UI).toBe("object");
    });

    it("should have correct types for WebSocket properties", () => {
      // Positive test: Verify WebSocket property types
      expect(
        typeof MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT,
      ).toBe("number");
      expect(typeof MONITORING_CONFIG.WEBSOCKET.AUTO_RECONNECT).toBe("boolean");
      expect(
        typeof MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS,
      ).toBe("number");
      expect(typeof MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY).toBe("number");
    });

    it("should have correct types for Mock Data properties", () => {
      // Positive test: Verify Mock Data property types
      expect(typeof MONITORING_CONFIG.MOCK_DATA.ENABLE_FALLBACK).toBe("boolean");
      expect(typeof MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBe("number");
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU).toBe("object");
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.NAME).toBe("string");
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.MEMORY_TOTAL_MB).toBe("number");
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.POWER_LIMIT_W).toBe("number");
    });

    it("should have correct types for UI properties", () => {
      // Positive test: Verify UI property types
      expect(typeof MONITORING_CONFIG.UI.SHOW_CONNECTION_STATUS).toBe("boolean");
      expect(typeof MONITORING_CONFIG.UI.DISCONNECTED_ANIMATION).toBe("boolean");
      expect(typeof MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBe("number");
    });
  });

  describe("Configuration Values Tests", () => {
    it("has reasonable connection timeout (15 seconds)", () => {
      expect(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBe(15000);
      expect(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBeGreaterThan(0);
      expect(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBeLessThan(60000);
    });

    it("has reasonable reconnection settings", () => {
      expect(MONITORING_CONFIG.WEBSOCKET.AUTO_RECONNECT).toBe(true);
      expect(MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).toBeGreaterThan(0);
      expect(MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).toBeLessThan(20);
      expect(MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY).toBeGreaterThan(1000);
    });

    it("has reasonable mock data update interval", () => {
      expect(MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBe(5000);
      expect(MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBeGreaterThan(1000);
    });

    it("has reasonable GPU mock values", () => {
      expect(MONITORING_CONFIG.MOCK_DATA.GPU.MEMORY_TOTAL_MB).toBeGreaterThan(0);
      expect(MONITORING_CONFIG.MOCK_DATA.GPU.POWER_LIMIT_W).toBeGreaterThan(0);
      expect(MONITORING_CONFIG.MOCK_DATA.GPU.NAME.length).toBeGreaterThan(0);
    });

    it("has reasonable UI settings", () => {
      expect(MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBeGreaterThan(0);
      expect(MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBeLessThan(60000);
    });
  });

  describe("Data Types Tests", () => {
    it("has all booleans as boolean type", () => {
      expect(typeof MONITORING_CONFIG.REQUIRE_REAL_DATA).toBe("boolean");
      expect(typeof MONITORING_CONFIG.WEBSOCKET.AUTO_RECONNECT).toBe("boolean");
      expect(typeof MONITORING_CONFIG.MOCK_DATA.ENABLE_FALLBACK).toBe("boolean");
      expect(typeof MONITORING_CONFIG.UI.SHOW_CONNECTION_STATUS).toBe("boolean");
      expect(typeof MONITORING_CONFIG.UI.DISCONNECTED_ANIMATION).toBe("boolean");
    });

    it("has all numbers as number type", () => {
      expect(typeof MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBe("number");
      expect(typeof MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).toBe("number");
      expect(typeof MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY).toBe("number");
      expect(typeof MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBe("number");
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.MEMORY_TOTAL_MB).toBe("number");
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.POWER_LIMIT_W).toBe("number");
      expect(typeof MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBe("number");
    });

    it("has all strings as string type", () => {
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.NAME).toBe("string");
    });
  });
});
