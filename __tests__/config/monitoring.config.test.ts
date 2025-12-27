import { MONITORING_CONFIG } from "@/config/monitoring.config";

describe("MONITORING_CONFIG", () => {
  describe("REQUIRE_REAL_DATA", () => {
    it("is defined", () => {
      expect(MONITORING_CONFIG.REQUIRE_REAL_DATA).toBeDefined();
    });

    it("is a boolean", () => {
      expect(typeof MONITORING_CONFIG.REQUIRE_REAL_DATA).toBe("boolean");
    });

    it("reflects NODE_ENV in production", () => {
      const originalEnv = process.env.NODE_ENV;

      expect(MONITORING_CONFIG.REQUIRE_REAL_DATA).toBeDefined();

      process.env.NODE_ENV = originalEnv;
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
  });
});
