import { MONITORING_CONFIG } from "@/config/monitoring.config";

describe("monitoring.config - WEBSOCKET configuration", () => {
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
