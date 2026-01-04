import { APP_CONFIG } from "@/config/app.config";

describe("app.config - Default Values Tests", () => {
  it("should have correct application name and version", () => {
    expect(APP_CONFIG.name).toBe("Llama Runner Pro");
    expect(APP_CONFIG.version).toBe("2.0.0");
    expect(APP_CONFIG.description).toBe(
      "Advanced Llama Model Management System"
    );
  });

  it("should have correct cache default values", () => {
    expect(APP_CONFIG.cache.ttl).toBe(300);
    expect(APP_CONFIG.cache.maxEntries).toBe(100);
  });

  it("should have correct feature flags", () => {
    expect(APP_CONFIG.features.analytics).toBe(true);
    expect(APP_CONFIG.features.realtimeMonitoring).toBe(true);
    expect(APP_CONFIG.features.modelManagement).toBe(true);
    expect(APP_CONFIG.features.authentication).toBe(false);
  });

  it("should have correct theme defaults", () => {
    expect(APP_CONFIG.theme.default).toBe("system");
    expect(APP_CONFIG.theme.dark).toBe("dark");
    expect(APP_CONFIG.theme.light).toBe("light");
  });
});
