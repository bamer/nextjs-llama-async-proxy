/**
 * Additional edge case and validation tests for monitoring.config.ts
 * These tests complement the main monitoring.config.test.ts file
 */

import { MONITORING_CONFIG, MonitoringConfig } from "@/config/monitoring.config";

describe("monitoring.config.ts - Edge Cases & Validation", () => {
  describe("Configuration Bounds", () => {
    it("has reasonable WebSocket connection timeout", () => {
      const timeout = MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT;
      expect(timeout).toBeGreaterThanOrEqual(5000); // At least 5 seconds
      expect(timeout).toBeLessThanOrEqual(60000); // At most 60 seconds
      expect(timeout).toBe(15000); // Exactly 15 seconds
    });

    it("has reasonable reconnect delay", () => {
      const delay = MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY;
      expect(delay).toBeGreaterThanOrEqual(1000); // At least 1 second
      expect(delay).toBeLessThanOrEqual(10000); // At most 10 seconds
      expect(delay).toBe(3000); // Exactly 3 seconds
    });

    it("has reasonable max reconnect attempts", () => {
      const attempts = MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS;
      expect(attempts).toBeGreaterThanOrEqual(1);
      expect(attempts).toBeLessThanOrEqual(20);
      expect(attempts).toBe(5); // Exactly 5 attempts
    });

    it("has reasonable mock data update interval", () => {
      const interval = MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL;
      expect(interval).toBeGreaterThanOrEqual(1000); // At least 1 second
      expect(interval).toBeLessThanOrEqual(60000); // At most 60 seconds
      expect(interval).toBe(5000); // Exactly 5 seconds
    });

    it("has reasonable error display duration", () => {
      const duration = MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION;
      expect(duration).toBeGreaterThanOrEqual(1000); // At least 1 second
      expect(duration).toBeLessThanOrEqual(60000); // At most 60 seconds
      expect(duration).toBe(10000); // Exactly 10 seconds
    });
  });

  describe("Boolean Configuration Consistency", () => {
    it("has consistent WebSocket reconnection settings", () => {
      const { AUTO_RECONNECT, MAX_RECONNECT_ATTEMPTS, RECONNECT_DELAY } =
        MONITORING_CONFIG.WEBSOCKET;

      // If auto reconnect is enabled, attempts and delay should be set
      if (AUTO_RECONNECT) {
        expect(MAX_RECONNECT_ATTEMPTS).toBeGreaterThan(0);
        expect(RECONNECT_DELAY).toBeGreaterThan(0);
      }
    });

    it("has consistent UI visibility settings", () => {
      const { SHOW_CONNECTION_STATUS, DISCONNECTED_ANIMATION } =
        MONITORING_CONFIG.UI;

      // Connection status and animation should both be booleans
      expect(typeof SHOW_CONNECTION_STATUS).toBe("boolean");
      expect(typeof DISCONNECTED_ANIMATION).toBe("boolean");
    });
  });

  describe("Mock Data Validation", () => {
    it("has realistic GPU memory value", () => {
      const memoryMB = MONITORING_CONFIG.MOCK_DATA.GPU.MEMORY_TOTAL_MB;
      expect(memoryMB).toBeGreaterThanOrEqual(1024); // At least 1GB
      expect(memoryMB).toBeLessThanOrEqual(98304); // At most 96GB
      expect(memoryMB).toBe(24576); // Exactly 24GB (RTX 4090)
    });

    it("has realistic GPU power limit", () => {
      const powerW = MONITORING_CONFIG.MOCK_DATA.GPU.POWER_LIMIT_W;
      expect(powerW).toBeGreaterThanOrEqual(50); // At least 50W
      expect(powerW).toBeLessThanOrEqual(1000); // At most 1000W
      expect(powerW).toBe(350); // Exactly 350W
    });

    it("has non-empty GPU name", () => {
      const name = MONITORING_CONFIG.MOCK_DATA.GPU.NAME;
      expect(name.length).toBeGreaterThan(0);
      expect(name.trim()).toBe(name);
      expect(name).toBe("NVIDIA RTX 4090");
    });
  });

  describe("Type Safety", () => {
    it("matches MonitoringConfig type definition", () => {
      const config: MonitoringConfig = MONITORING_CONFIG;
      expect(config).toBe(MONITORING_CONFIG);
    });

    it("has correct types for all WebSocket properties", () => {
      const ws = MONITORING_CONFIG.WEBSOCKET;
      expect(typeof ws.CONNECTION_TIMEOUT).toBe("number");
      expect(typeof ws.AUTO_RECONNECT).toBe("boolean");
      expect(typeof ws.MAX_RECONNECT_ATTEMPTS).toBe("number");
      expect(typeof ws.RECONNECT_DELAY).toBe("number");
    });

    it("has correct types for all Mock Data properties", () => {
      const mock = MONITORING_CONFIG.MOCK_DATA;
      expect(typeof mock.ENABLE_FALLBACK).toBe("boolean");
      expect(typeof mock.UPDATE_INTERVAL).toBe("number");
      expect(typeof mock.GPU).toBe("object");
      expect(typeof mock.GPU.NAME).toBe("string");
      expect(typeof mock.GPU.MEMORY_TOTAL_MB).toBe("number");
      expect(typeof mock.GPU.POWER_LIMIT_W).toBe("number");
    });

    it("has correct types for all UI properties", () => {
      const ui = MONITORING_CONFIG.UI;
      expect(typeof ui.SHOW_CONNECTION_STATUS).toBe("boolean");
      expect(typeof ui.DISCONNECTED_ANIMATION).toBe("boolean");
      expect(typeof ui.ERROR_DISPLAY_DURATION).toBe("number");
    });
  });

  describe("Configuration Relationships", () => {
    it("has WebSocket settings that work together", () => {
      const { AUTO_RECONNECT, MAX_RECONNECT_ATTEMPTS, RECONNECT_DELAY } =
        MONITORING_CONFIG.WEBSOCKET;

      // Total timeout should be reasonable
      const totalTimeout = MAX_RECONNECT_ATTEMPTS * RECONNECT_DELAY;
      expect(totalTimeout).toBeLessThan(60000); // Less than 1 minute total
      expect(totalTimeout).toBe(5 * 3000); // Exactly 15 seconds
    });

    it("has UI settings that complement WebSocket settings", () => {
      const timeout = MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT;
      const errorDuration = MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION;

      // Error display should be shorter than connection timeout
      expect(errorDuration).toBeLessThanOrEqual(timeout);
      expect(errorDuration).toBe(10000);
      expect(timeout).toBe(15000);
    });
  });

  describe("Environment Awareness", () => {
    it("reflects environment in REQUIRE_REAL_DATA", () => {
      const requireReal = MONITORING_CONFIG.REQUIRE_REAL_DATA;
      expect(typeof requireReal).toBe("boolean");

      // Should match production environment
      if (process.env.NODE_ENV === "production") {
        expect(requireReal).toBe(true);
      }
    });

    it("reflects environment in MOCK_DATA.ENABLE_FALLBACK", () => {
      const enableFallback = MONITORING_CONFIG.MOCK_DATA.ENABLE_FALLBACK;
      expect(typeof enableFallback).toBe("boolean");

      // Should be disabled in production
      if (process.env.NODE_ENV === "production") {
        expect(enableFallback).toBe(false);
      }
    });
  });

  describe("Value Formats", () => {
    it("has numeric values as integers where appropriate", () => {
      expect(Number.isInteger(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT)).toBe(
        true,
      );
      expect(Number.isInteger(MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS)).toBe(
        true,
      );
      expect(Number.isInteger(MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY)).toBe(
        true,
      );
      expect(Number.isInteger(MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL)).toBe(
        true,
      );
    });

    it("has string values with no leading/trailing whitespace", () => {
      const name = MONITORING_CONFIG.MOCK_DATA.GPU.NAME;
      expect(name).toBe(name.trim());
    });
  });

  describe("Edge Cases", () => {
    it("handles accessing nested properties safely", () => {
      expect(() => {
        const val = MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT;
        return val;
      }).not.toThrow();
    });

    it("maintains consistent structure across properties", () => {
      expect(MONITORING_CONFIG.REQUIRE_REAL_DATA).toBeDefined();
      expect(MONITORING_CONFIG.WEBSOCKET).toBeDefined();
      expect(MONITORING_CONFIG.MOCK_DATA).toBeDefined();
      expect(MONITORING_CONFIG.UI).toBeDefined();
    });

    it("has no undefined or null numeric values", () => {
      expect(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).not.toBeNull();
      expect(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).not.toBeUndefined();
      expect(MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).not.toBeNull();
      expect(MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).not.toBeUndefined();
    });

    it("has no undefined or null boolean values", () => {
      expect(MONITORING_CONFIG.WEBSOCKET.AUTO_RECONNECT).not.toBeNull();
      expect(MONITORING_CONFIG.WEBSOCKET.AUTO_RECONNECT).not.toBeUndefined();
      expect(MONITORING_CONFIG.UI.SHOW_CONNECTION_STATUS).not.toBeNull();
      expect(MONITORING_CONFIG.UI.SHOW_CONNECTION_STATUS).not.toBeUndefined();
    });
  });

  describe("Configuration Safety", () => {
    it("prevents division by zero in reconnection calculations", () => {
      // Even if RECONNECT_DELAY changes, the division won't cause errors
      const { MAX_RECONNECT_ATTEMPTS, RECONNECT_DELAY } =
        MONITORING_CONFIG.WEBSOCKET;
      expect(RECONNECT_DELAY).toBeGreaterThan(0);
      expect(MAX_RECONNECT_ATTEMPTS).toBeGreaterThan(0);
    });

    it("has valid GPU memory in bytes conversion", () => {
      const memoryMB = MONITORING_CONFIG.MOCK_DATA.GPU.MEMORY_TOTAL_MB;
      const memoryBytes = memoryMB * 1024 * 1024;
      expect(memoryBytes).toBeGreaterThan(0);
      expect(Number.isSafeInteger(memoryBytes)).toBe(true);
    });
  });

  describe("Production Readiness", () => {
    it("has production-safe WebSocket settings", () => {
      const ws = MONITORING_CONFIG.WEBSOCKET;
      // Timeout should be sufficient for production networks
      expect(ws.CONNECTION_TIMEOUT).toBeGreaterThanOrEqual(10000);
      // Should have auto-reconnect for production resilience
      expect(ws.AUTO_RECONNECT).toBe(true);
    });

    it("has production-safe UI settings", () => {
      const ui = MONITORING_CONFIG.UI;
      // Should show connection status for production monitoring
      expect(ui.SHOW_CONNECTION_STATUS).toBe(true);
      // Error display should be reasonable
      expect(ui.ERROR_DISPLAY_DURATION).toBeGreaterThan(0);
    });
  });
});
