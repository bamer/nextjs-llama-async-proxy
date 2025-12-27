import fs from "fs";
import path from "path";

describe("models_config.json", () => {
  let config: Record<string, unknown>;
  let configPath: string;

  beforeAll(() => {
    configPath = path.join(process.cwd(), "src/config/models_config.json");
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
      expect(config).toHaveProperty("default_parameters");
      expect(config).toHaveProperty("models");
      expect(config).toHaveProperty("default_model");
    });
  });

  describe("default_parameters configuration", () => {
    it("has default_parameters as object", () => {
      expect(typeof config.default_parameters).toBe("object");
      expect(config.default_parameters).not.toBeNull();
    });

    it("has ctx_size in default_parameters", () => {
      expect(config.default_parameters).toHaveProperty("ctx_size");
      expect(typeof (config.default_parameters as Record<string, unknown>).ctx_size).toBe("number");
    });

    it("has temp in default_parameters", () => {
      expect(config.default_parameters).toHaveProperty("temp");
      expect(typeof (config.default_parameters as Record<string, unknown>).temp).toBe("number");
    });

    it("has batch_size in default_parameters", () => {
      expect(config.default_parameters).toHaveProperty("batch_size");
      expect(typeof (config.default_parameters as Record<string, unknown>).batch_size).toBe("number");
    });

    it("has ubatch_size in default_parameters", () => {
      expect(config.default_parameters).toHaveProperty("ubatch_size");
      expect(typeof (config.default_parameters as Record<string, unknown>).ubatch_size).toBe("number");
    });

    it("has threads in default_parameters", () => {
      expect(config.default_parameters).toHaveProperty("threads");
      expect(typeof (config.default_parameters as Record<string, unknown>).threads).toBe("number");
    });

    it("has mlock in default_parameters", () => {
      expect(config.default_parameters).toHaveProperty("mlock");
      expect(typeof (config.default_parameters as Record<string, unknown>).mlock).toBe("boolean");
    });

    it("has no_mmap in default_parameters", () => {
      expect(config.default_parameters).toHaveProperty("no_mmap");
      expect(typeof (config.default_parameters as Record<string, unknown>).no_mmap).toBe("boolean");
    });

    it("has flash_attn in default_parameters", () => {
      expect(config.default_parameters).toHaveProperty("flash_attn");
      expect(typeof (config.default_parameters as Record<string, unknown>).flash_attn).toBe("string");
    });

    it("has port in default_parameters", () => {
      expect(config.default_parameters).toHaveProperty("port");
      expect(typeof (config.default_parameters as Record<string, unknown>).port).toBe("number");
    });

    it("has host in default_parameters", () => {
      expect(config.default_parameters).toHaveProperty("host");
      expect(typeof (config.default_parameters as Record<string, unknown>).host).toBe("string");
    });
  });

  describe("default_parameters values", () => {
    it("has valid ctx_size value", () => {
      const ctx_size = (config.default_parameters as Record<string, unknown>).ctx_size as number;
      expect(ctx_size).toBeGreaterThan(0);
    });

    it("has valid temp value between 0 and 2", () => {
      const temp = (config.default_parameters as Record<string, unknown>).temp as number;
      expect(temp).toBeGreaterThanOrEqual(0);
      expect(temp).toBeLessThanOrEqual(2);
    });

    it("has valid batch_size value", () => {
      const batch_size = (config.default_parameters as Record<string, unknown>).batch_size as number;
      expect(batch_size).toBeGreaterThan(0);
    });

    it("has valid ubatch_size value", () => {
      const ubatch_size = (config.default_parameters as Record<string, unknown>).ubatch_size as number;
      expect(ubatch_size).toBeGreaterThan(0);
    });

    it("has valid threads value (positive number)", () => {
      const threads = (config.default_parameters as Record<string, unknown>).threads as number;
      expect(threads).toBeGreaterThan(0);
    });

    it("has valid port number", () => {
      const port = (config.default_parameters as Record<string, unknown>).port as number;
      expect(port).toBeGreaterThanOrEqual(1024);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it("has valid host address", () => {
      const host = (config.default_parameters as Record<string, unknown>).host as string;
      expect(host).toBeTruthy();
      expect(host.length).toBeGreaterThan(0);
    });

    it("has valid flash_attn value", () => {
      const flash_attn = (config.default_parameters as Record<string, unknown>).flash_attn as string;
      expect(["on", "off", "auto"]).toContain(flash_attn);
    });
  });

  describe("models configuration", () => {
    it("has models as object", () => {
      expect(typeof config.models).toBe("object");
      expect(config.models).not.toBeNull();
    });

    it("models is initially empty", () => {
      expect(Object.keys(config.models as Record<string, unknown>).length).toBe(0);
    });
  });

  describe("default_model configuration", () => {
    it("has default_model property", () => {
      expect(config).toHaveProperty("default_model");
    });

    it("default_model is initially null", () => {
      expect(config.default_model).toBeNull();
    });
  });

  describe("configuration validation", () => {
    it("has valid mlock boolean value", () => {
      const mlock = (config.default_parameters as Record<string, unknown>).mlock as boolean;
      expect(typeof mlock).toBe("boolean");
    });

    it("has valid no_mmap boolean value", () => {
      const no_mmap = (config.default_parameters as Record<string, unknown>).no_mmap as boolean;
      expect(typeof no_mmap).toBe("boolean");
    });

    it("has all required parameters present", () => {
      const requiredParams = [
        "ctx_size",
        "temp",
        "batch_size",
        "ubatch_size",
        "threads",
        "mlock",
        "no_mmap",
        "flash_attn",
        "port",
        "host"
      ];
      requiredParams.forEach((param) => {
        expect(config.default_parameters).toHaveProperty(param);
      });
    });
  });
});
