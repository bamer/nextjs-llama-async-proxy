import { APP_CONFIG, AppConfig } from "@/config/app.config";

describe("app.config - Export Verification", () => {
  it("should export APP_CONFIG constant", () => {
    expect(APP_CONFIG).toBeDefined();
    expect(typeof APP_CONFIG).toBe("object");
  });

  it("should export AppConfig type", () => {
    const typedConfig: AppConfig = APP_CONFIG;
    expect(typedConfig).toEqual(APP_CONFIG);
  });

  it("should have no null or undefined top-level properties", () => {
    Object.keys(APP_CONFIG).forEach((key) => {
      expect(APP_CONFIG[key as keyof typeof APP_CONFIG]).toBeDefined();
      expect(APP_CONFIG[key as keyof typeof APP_CONFIG]).not.toBeNull();
    });
  });
});
