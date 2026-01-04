import { MONITORING_CONFIG } from "@/config/monitoring.config";

describe("monitoring.config - MOCK_DATA configuration", () => {
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
