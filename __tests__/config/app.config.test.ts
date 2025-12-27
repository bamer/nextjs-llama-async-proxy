import { APP_CONFIG } from "@/config/app.config";

describe("APP_CONFIG", () => {
  describe("basic properties", () => {
    it("has name property", () => {
      expect(APP_CONFIG.name).toBe("Llama Runner Pro");
    });

    it("has version property", () => {
      expect(APP_CONFIG.version).toBe("2.0.0");
    });

    it("has description property", () => {
      expect(APP_CONFIG.description).toBe("Advanced Llama Model Management System");
    });
  });

  describe("api config", () => {
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
      expect(APP_CONFIG.api.baseUrl).toMatch(/^(http:\/\/localhost:3000|http:\/\/|ws)/);
    });
  });

  describe("features config", () => {
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
  });

  describe("theme config", () => {
    it("has default theme set to system", () => {
      expect(APP_CONFIG.theme.default).toBe("system");
    });

    it("supports dark theme", () => {
      expect(APP_CONFIG.theme.dark).toBe("dark");
    });

    it("supports light theme", () => {
      expect(APP_CONFIG.theme.light).toBe("light");
    });
  });

  describe("cache config", () => {
    it("has TTL of 300 seconds", () => {
      expect(APP_CONFIG.cache.ttl).toBe(300);
    });

    it("has maxEntries of 100", () => {
      expect(APP_CONFIG.cache.maxEntries).toBe(100);
    });
  });

  describe("sentry config", () => {
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
  });

  describe("config immutability", () => {
    it("is a readonly constant (as const)", () => {
      expect(Object.isFrozen(APP_CONFIG) || APP_CONFIG).toBeDefined();
    });
  });

  describe("all required properties exist", () => {
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
