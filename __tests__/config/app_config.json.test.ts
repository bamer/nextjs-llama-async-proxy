import fs from "fs";
import path from "path";

describe("app_config.json", () => {
  let config: Record<string, unknown>;
  let configPath: string;

  beforeAll(() => {
    configPath = path.join(process.cwd(), "src/config/app_config.json");
    const content = fs.readFileSync(configPath, "utf-8");
    config = JSON.parse(content);
  });

  describe("JSON structure", () => {
    it("is valid JSON that can be parsed", () => {
      expect(() => {
        const content = fs.readFileSync(configPath, "utf-8");
        JSON.parse(content);
      }).not.toThrow();
    });

    it("has all expected top-level properties", () => {
      expect(config).toHaveProperty("basePath");
      expect(config).toHaveProperty("logLevel");
      expect(config).toHaveProperty("maxConcurrentModels");
      expect(config).toHaveProperty("autoUpdate");
      expect(config).toHaveProperty("notificationsEnabled");
      expect(config).toHaveProperty("modelDefaultsParams");
      expect(config).toHaveProperty("runtimes");
    });
  });

  describe("top-level properties", () => {
    it("has basePath as string", () => {
      expect(typeof config.basePath).toBe("string");
      expect(config.basePath).toBeTruthy();
    });

    it("has logLevel as string", () => {
      expect(typeof config.logLevel).toBe("string");
      expect(config.logLevel).toBeTruthy();
    });

    it("has maxConcurrentModels as number", () => {
      expect(typeof config.maxConcurrentModels).toBe("number");
      expect(config.maxConcurrentModels).toBeGreaterThan(0);
    });

    it("has autoUpdate as boolean", () => {
      expect(typeof config.autoUpdate).toBe("boolean");
    });

    it("has notificationsEnabled as boolean", () => {
      expect(typeof config.notificationsEnabled).toBe("boolean");
    });
  });

  describe("modelDefaultsParams configuration", () => {
    it("has modelDefaultsParams as object", () => {
      expect(typeof config.modelDefaultsParams).toBe("object");
      expect(config.modelDefaultsParams).not.toBeNull();
    });

    it("has ctx_size in modelDefaultsParams", () => {
      expect(config.modelDefaultsParams).toHaveProperty("ctx_size");
      expect(typeof (config.modelDefaultsParams as Record<string, unknown>).ctx_size).toBe("number");
    });

    it("has batch_size in modelDefaultsParams", () => {
      expect(config.modelDefaultsParams).toHaveProperty("batch_size");
      expect(typeof (config.modelDefaultsParams as Record<string, unknown>).batch_size).toBe("number");
    });

    it("has temperature in modelDefaultsParams", () => {
      expect(config.modelDefaultsParams).toHaveProperty("temperature");
      expect(typeof (config.modelDefaultsParams as Record<string, unknown>).temperature).toBe("number");
    });

    it("has top_p in modelDefaultsParams", () => {
      expect(config.modelDefaultsParams).toHaveProperty("top_p");
      expect(typeof (config.modelDefaultsParams as Record<string, unknown>).top_p).toBe("number");
    });

    it("has top_k in modelDefaultsParams", () => {
      expect(config.modelDefaultsParams).toHaveProperty("top_k");
      expect(typeof (config.modelDefaultsParams as Record<string, unknown>).top_k).toBe("number");
    });

    it("has gpu_layers in modelDefaultsParams", () => {
      expect(config.modelDefaultsParams).toHaveProperty("gpu_layers");
      expect(typeof (config.modelDefaultsParams as Record<string, unknown>).gpu_layers).toBe("number");
    });

    it("has threads in modelDefaultsParams", () => {
      expect(config.modelDefaultsParams).toHaveProperty("threads");
      expect(typeof (config.modelDefaultsParams as Record<string, unknown>).threads).toBe("number");
    });

    it("has supports_tools in modelDefaultsParams", () => {
      expect(config.modelDefaultsParams).toHaveProperty("supports_tools");
      expect(typeof (config.modelDefaultsParams as Record<string, unknown>).supports_tools).toBe("boolean");
    });
  });

  describe("modelDefaultsParams values", () => {
    it("has valid ctx_size value", () => {
      const ctx_size = (config.modelDefaultsParams as Record<string, unknown>).ctx_size as number;
      expect(ctx_size).toBeGreaterThan(0);
    });

    it("has valid batch_size value", () => {
      const batch_size = (config.modelDefaultsParams as Record<string, unknown>).batch_size as number;
      expect(batch_size).toBeGreaterThan(0);
    });

    it("has valid temperature value between 0 and 2", () => {
      const temperature = (config.modelDefaultsParams as Record<string, unknown>).temperature as number;
      expect(temperature).toBeGreaterThanOrEqual(0);
      expect(temperature).toBeLessThanOrEqual(2);
    });

    it("has valid top_p value between 0 and 1", () => {
      const top_p = (config.modelDefaultsParams as Record<string, unknown>).top_p as number;
      expect(top_p).toBeGreaterThanOrEqual(0);
      expect(top_p).toBeLessThanOrEqual(1);
    });

    it("has valid top_k value", () => {
      const top_k = (config.modelDefaultsParams as Record<string, unknown>).top_k as number;
      expect(top_k).toBeGreaterThanOrEqual(0);
    });

    it("has valid threads value (-1 for auto or positive)", () => {
      const threads = (config.modelDefaultsParams as Record<string, unknown>).threads as number;
      expect(threads === -1 || threads > 0).toBe(true);
    });
  });

  describe("runtimes configuration", () => {
    it("has runtimes as object", () => {
      expect(typeof config.runtimes).toBe("object");
      expect(config.runtimes).not.toBeNull();
    });

    it("has llama-server runtime configuration", () => {
      expect(config.runtimes).toHaveProperty("llama-server");
    });

    it("has runtime_windows path", () => {
      expect((config.runtimes as Record<string, unknown>)).toHaveProperty("llama-server");
      const llamaServer = (config.runtimes as Record<string, Record<string, unknown>>)["llama-server"];
      expect(llamaServer).toHaveProperty("runtime_windows");
      expect(typeof llamaServer.runtime_windows).toBe("string");
    });

    it("has runtime_linux path", () => {
      expect((config.runtimes as Record<string, unknown>)).toHaveProperty("llama-server");
      const llamaServer = (config.runtimes as Record<string, Record<string, unknown>>)["llama-server"];
      expect(llamaServer).toHaveProperty("runtime_linux");
      expect(typeof llamaServer.runtime_linux).toBe("string");
    });

    it("has valid Windows runtime path", () => {
      const llamaServer = (config.runtimes as Record<string, Record<string, unknown>>)["llama-server"];
      expect(llamaServer.runtime_windows).toContain("llama-server.exe");
    });

    it("has valid Linux runtime path", () => {
      const llamaServer = (config.runtimes as Record<string, Record<string, unknown>>)["llama-server"];
      expect(llamaServer.runtime_linux).toContain("llama.cpp/build/bin");
    });
  });

  describe("configuration validation", () => {
    it("has reasonable maxConcurrentModels value", () => {
      expect(config.maxConcurrentModels).toBeGreaterThan(0);
      expect(config.maxConcurrentModels).toBeLessThan(100);
    });

    it("has valid logLevel value", () => {
      const validLogLevels = ["error", "warn", "info", "debug", "trace"];
      expect(validLogLevels).toContain(config.logLevel as string);
    });

    it("has valid basePath value", () => {
      expect(typeof config.basePath).toBe("string");
      expect((config.basePath as string).length).toBeGreaterThan(0);
    });
  });
});
