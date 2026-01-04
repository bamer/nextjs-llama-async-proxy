import { APP_CONFIG } from "@/config/app.config";

describe("app.config - Environment Variable Override Tests", () => {
  it("should use default API URL when env var is not set", () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_URL;
    delete (process.env as unknown as Record<string, string | undefined>)
      .NEXT_PUBLIC_API_URL;

    const { APP_CONFIG: testConfig } = require("@/config/app.config");

    expect(testConfig.api.baseUrl).toBe("http://localhost:3000");

    if (originalEnv) {
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    }
  });

  it("should use custom API URL when env var is set", () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = "https://custom.api.com";

    jest.resetModules();
    const { APP_CONFIG: testConfig } = require("@/config/app.config");

    expect(testConfig.api.baseUrl).toBe("https://custom.api.com");

    if (originalEnv) {
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    } else {
      delete (process.env as unknown as Record<string, string | undefined>)
        .NEXT_PUBLIC_API_URL;
    }
    jest.resetModules();
  });
});
