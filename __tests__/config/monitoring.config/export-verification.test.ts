import { MONITORING_CONFIG } from "@/config/monitoring.config";

describe("monitoring.config - Export Verification", () => {
  it("should export MONITORING_CONFIG constant", () => {
    expect(MONITORING_CONFIG).toBeDefined();
    expect(typeof MONITORING_CONFIG).toBe("object");
  });

  it("should export MonitoringConfig type", () => {
    const typedConfig = MONITORING_CONFIG as unknown;
    expect(typedConfig).toEqual(MONITORING_CONFIG);
  });

  it("should have no undefined top-level properties", () => {
    expect(MONITORING_CONFIG.REQUIRE_REAL_DATA).toBeDefined();
    expect(MONITORING_CONFIG.WEBSOCKET).toBeDefined();
    expect(MONITORING_CONFIG.MOCK_DATA).toBeDefined();
    expect(MONITORING_CONFIG.UI).toBeDefined();
  });
});
