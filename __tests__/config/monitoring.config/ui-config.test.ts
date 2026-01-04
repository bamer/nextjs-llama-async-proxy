import { MONITORING_CONFIG } from "@/config/monitoring.config";

describe("monitoring.config - UI configuration", () => {
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
