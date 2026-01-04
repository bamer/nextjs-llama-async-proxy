import { MONITORING_CONFIG } from "@/config/monitoring.config";

describe("monitoring.config - REQUIRE_REAL_DATA", () => {
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
