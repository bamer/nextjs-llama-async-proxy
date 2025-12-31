import fs from "fs";
import path from "path";

describe("llama_options_reference.json", () => {
  let config: Record<string, unknown>;
  let configPath: string;

  beforeAll(() => {
    configPath = path.join(process.cwd(), "src/config/llama_options_reference.json");
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

    it("has llama_options as top-level property", () => {
      expect(config).toHaveProperty("llama_options");
      expect(typeof config.llama_options).toBe("object");
      expect(config.llama_options).not.toBeNull();
    });

    it("has all expected categories", () => {
      const expectedCategories = ["basic", "gpu", "performance", "sampling", "advanced", "logging", "special"];
      const llamaOptions = config.llama_options as Record<string, unknown>;
      expectedCategories.forEach((category) => {
        expect(llamaOptions).toHaveProperty(category);
      });
    });
  });

  describe("basic category", () => {
    let basic: Record<string, unknown>;

    beforeAll(() => {
      basic = (config.llama_options as Record<string, Record<string, unknown>>).basic;
    });

    it("has ctx_size option", () => {
      expect(basic).toHaveProperty("ctx_size");
      expect(typeof basic.ctx_size).toBe("object");
    });

    it("ctx_size has required fields", () => {
      const ctx_size = basic.ctx_size as Record<string, unknown>;
      expect(ctx_size).toHaveProperty("short");
      expect(ctx_size).toHaveProperty("long");
      expect(ctx_size).toHaveProperty("type");
      expect(ctx_size).toHaveProperty("default");
      expect(ctx_size).toHaveProperty("description");
      expect(ctx_size).toHaveProperty("tooltip");
    });

    it("has batch_size option", () => {
      expect(basic).toHaveProperty("batch_size");
      expect(typeof basic.batch_size).toBe("object");
    });

    it("has threads option", () => {
      expect(basic).toHaveProperty("threads");
      expect(typeof basic.threads).toBe("object");
    });

    it("has port option", () => {
      expect(basic).toHaveProperty("port");
      expect(typeof basic.port).toBe("object");
    });

    it("has host option", () => {
      expect(basic).toHaveProperty("host");
      expect(typeof basic.host).toBe("object");
    });

    it("has seed option", () => {
      expect(basic).toHaveProperty("seed");
      expect(typeof basic.seed).toBe("object");
    });
  });

  describe("gpu category", () => {
    let gpu: Record<string, unknown>;

    beforeAll(() => {
      gpu = (config.llama_options as Record<string, Record<string, unknown>>).gpu;
    });

    it("has gpu_layers option", () => {
      expect(gpu).toHaveProperty("gpu_layers");
      expect(typeof gpu.gpu_layers).toBe("object");
    });

    it("gpu_layers has required fields", () => {
      const gpu_layers = gpu.gpu_layers as Record<string, unknown>;
      expect(gpu_layers).toHaveProperty("short");
      expect(gpu_layers).toHaveProperty("long");
      expect(gpu_layers).toHaveProperty("type");
      expect(gpu_layers).toHaveProperty("default");
      expect(gpu_layers).toHaveProperty("description");
      expect(gpu_layers).toHaveProperty("tooltip");
    });

    it("has n_cpu_moe option", () => {
      expect(gpu).toHaveProperty("n_cpu_moe");
      expect(typeof gpu.n_cpu_moe).toBe("object");
    });

    it("has cpu_moe option", () => {
      expect(gpu).toHaveProperty("cpu_moe");
      expect(typeof gpu.cpu_moe).toBe("object");
    });

    it("has main_gpu option", () => {
      expect(gpu).toHaveProperty("main_gpu");
      expect(typeof gpu.main_gpu).toBe("object");
    });

    it("has tensor_split option", () => {
      expect(gpu).toHaveProperty("tensor_split");
      expect(typeof gpu.tensor_split).toBe("object");
    });

    it("has split_mode option", () => {
      expect(gpu).toHaveProperty("split_mode");
      expect(typeof gpu.split_mode).toBe("object");
    });

    it("split_mode has options array", () => {
      const split_mode = gpu.split_mode as Record<string, unknown>;
      expect(split_mode).toHaveProperty("options");
      expect(Array.isArray(split_mode.options)).toBe(true);
    });

    it("has no_mmap option", () => {
      expect(gpu).toHaveProperty("no_mmap");
      expect(typeof gpu.no_mmap).toBe("object");
    });

    it("has mlock option", () => {
      expect(gpu).toHaveProperty("mlock");
      expect(typeof gpu.mlock).toBe("object");
    });
  });

  describe("performance category", () => {
    let performance: Record<string, unknown>;

    beforeAll(() => {
      performance = (config.llama_options as Record<string, Record<string, unknown>>).performance;
    });

    it("has parallel option", () => {
      expect(performance).toHaveProperty("parallel");
      expect(typeof performance.parallel).toBe("object");
    });

    it("parallel has required fields", () => {
      const parallel = performance.parallel as Record<string, unknown>;
      expect(parallel).toHaveProperty("short");
      expect(parallel).toHaveProperty("long");
      expect(parallel).toHaveProperty("type");
      expect(parallel).toHaveProperty("default");
      expect(parallel).toHaveProperty("description");
      expect(parallel).toHaveProperty("tooltip");
    });

    it("has flash_attn option", () => {
      expect(performance).toHaveProperty("flash_attn");
      expect(typeof performance.flash_attn).toBe("object");
    });

    it("flash_attn has options array", () => {
      const flash_attn = performance.flash_attn as Record<string, unknown>;
      expect(flash_attn).toHaveProperty("options");
      expect(Array.isArray(flash_attn.options)).toBe(true);
    });

    it("has cont_batching option", () => {
      expect(performance).toHaveProperty("cont_batching");
      expect(typeof performance.cont_batching).toBe("object");
    });

    it("has cache_reuse option", () => {
      expect(performance).toHaveProperty("cache_reuse");
      expect(typeof performance.cache_reuse).toBe("object");
    });
  });

  describe("sampling category", () => {
    let sampling: Record<string, unknown>;

    beforeAll(() => {
      sampling = (config.llama_options as Record<string, Record<string, unknown>>).sampling;
    });

    it("has temperature option", () => {
      expect(sampling).toHaveProperty("temperature");
      expect(typeof sampling.temperature).toBe("object");
    });

    it("temperature has required fields", () => {
      const temperature = sampling.temperature as Record<string, unknown>;
      expect(temperature).toHaveProperty("short");
      expect(temperature).toHaveProperty("type");
      expect(temperature).toHaveProperty("default");
      expect(temperature).toHaveProperty("min");
      expect(temperature).toHaveProperty("max");
      expect(temperature).toHaveProperty("description");
      expect(temperature).toHaveProperty("tooltip");
    });

    it("temperature has valid default value", () => {
      const temperature = sampling.temperature as Record<string, unknown>;
      expect(temperature.default).toBeGreaterThanOrEqual(0);
      expect(temperature.default).toBeLessThanOrEqual(2);
    });

    it("has top_k option", () => {
      expect(sampling).toHaveProperty("top_k");
      expect(typeof sampling.top_k).toBe("object");
    });

    it("has top_p option", () => {
      expect(sampling).toHaveProperty("top_p");
      expect(typeof sampling.top_p).toBe("object");
    });

    it("has min_p option", () => {
      expect(sampling).toHaveProperty("min_p");
      expect(typeof sampling.min_p).toBe("object");
    });

    it("has repeat_penalty option", () => {
      expect(sampling).toHaveProperty("repeat_penalty");
      expect(typeof sampling.repeat_penalty).toBe("object");
    });

    it("has repeat_last_n option", () => {
      expect(sampling).toHaveProperty("repeat_last_n");
      expect(typeof sampling.repeat_last_n).toBe("object");
    });

    it("has mirostat option", () => {
      expect(sampling).toHaveProperty("mirostat");
      expect(typeof sampling.mirostat).toBe("object");
    });

    it("mirostat has options array", () => {
      const mirostat = sampling.mirostat as Record<string, unknown>;
      expect(mirostat).toHaveProperty("options");
      expect(Array.isArray(mirostat.options)).toBe(true);
    });

    it("has mirostat_eta option", () => {
      expect(sampling).toHaveProperty("mirostat_eta");
      expect(typeof sampling.mirostat_eta).toBe("object");
    });

    it("has mirostat_tau option", () => {
      expect(sampling).toHaveProperty("mirostat_tau");
      expect(typeof sampling.mirostat_tau).toBe("object");
    });
  });

  describe("advanced category", () => {
    let advanced: Record<string, unknown>;

    beforeAll(() => {
      advanced = (config.llama_options as Record<string, Record<string, unknown>>).advanced;
    });

    it("has rope_scaling option", () => {
      expect(advanced).toHaveProperty("rope_scaling");
      expect(typeof advanced.rope_scaling).toBe("object");
    });

    it("rope_scaling has options array", () => {
      const rope_scaling = advanced.rope_scaling as Record<string, unknown>;
      expect(rope_scaling).toHaveProperty("options");
      expect(Array.isArray(rope_scaling.options)).toBe(true);
    });

    it("has rope_scale option", () => {
      expect(advanced).toHaveProperty("rope_scale");
      expect(typeof advanced.rope_scale).toBe("object");
    });

    it("has cache_type_k option", () => {
      expect(advanced).toHaveProperty("cache_type_k");
      expect(typeof advanced.cache_type_k).toBe("object");
    });

    it("cache_type_k has options array", () => {
      const cache_type_k = advanced.cache_type_k as Record<string, unknown>;
      expect(cache_type_k).toHaveProperty("options");
      expect(Array.isArray(cache_type_k.options)).toBe(true);
    });

    it("has cache_type_v option", () => {
      expect(advanced).toHaveProperty("cache_type_v");
      expect(typeof advanced.cache_type_v).toBe("object");
    });

    it("has numa option", () => {
      expect(advanced).toHaveProperty("numa");
      expect(typeof advanced.numa).toBe("object");
    });

    it("numa has options array", () => {
      const numa = advanced.numa as Record<string, unknown>;
      expect(numa).toHaveProperty("options");
      expect(Array.isArray(numa.options)).toBe(true);
    });
  });

  describe("logging category", () => {
    let logging: Record<string, unknown>;

    beforeAll(() => {
      logging = (config.llama_options as Record<string, Record<string, unknown>>).logging;
    });

    it("has verbose option", () => {
      expect(logging).toHaveProperty("verbose");
      expect(typeof logging.verbose).toBe("object");
    });

    it("verbose has required fields", () => {
      const verbose = logging.verbose as Record<string, unknown>;
      expect(verbose).toHaveProperty("short");
      expect(verbose).toHaveProperty("long");
      expect(verbose).toHaveProperty("type");
      expect(verbose).toHaveProperty("default");
      expect(verbose).toHaveProperty("description");
      expect(verbose).toHaveProperty("tooltip");
    });

    it("has log_colors option", () => {
      expect(logging).toHaveProperty("log_colors");
      expect(typeof logging.log_colors).toBe("object");
    });

    it("log_colors has options array", () => {
      const log_colors = logging.log_colors as Record<string, unknown>;
      expect(log_colors).toHaveProperty("options");
      expect(Array.isArray(log_colors.options)).toBe(true);
    });

    it("has log_timestamps option", () => {
      expect(logging).toHaveProperty("log_timestamps");
      expect(typeof logging.log_timestamps).toBe("object");
    });
  });

  describe("special category", () => {
    let special: Record<string, unknown>;

    beforeAll(() => {
      special = (config.llama_options as Record<string, Record<string, unknown>>).special;
    });

    it("has jinja option", () => {
      expect(special).toHaveProperty("jinja");
      expect(typeof special.jinja).toBe("object");
    });

    it("jinja has required fields", () => {
      const jinja = special.jinja as Record<string, unknown>;
      expect(jinja).toHaveProperty("long");
      expect(jinja).toHaveProperty("type");
      expect(jinja).toHaveProperty("default");
      expect(jinja).toHaveProperty("description");
      expect(jinja).toHaveProperty("tooltip");
    });

    it("has metrics option", () => {
      expect(special).toHaveProperty("metrics");
      expect(typeof special.metrics).toBe("object");
    });

    it("has embedding option", () => {
      expect(special).toHaveProperty("embedding");
      expect(typeof special.embedding).toBe("object");
    });

    it("has timeout option", () => {
      expect(special).toHaveProperty("timeout");
      expect(typeof special.timeout).toBe("object");
    });
  });

  describe("option field types", () => {
    it("valid option has correct field structure for basic options", () => {
      const basic = (config.llama_options as Record<string, Record<string, unknown>>).basic;
      const option = basic.ctx_size as Record<string, unknown>;
      expect(typeof option.short).toBe("string");
      expect(typeof option.long).toBe("string");
      expect(typeof option.type).toBe("string");
      expect(typeof option.default).toBe("number");
      expect(typeof option.description).toBe("string");
      expect(typeof option.tooltip).toBe("string");
    });

    it("valid option has correct field structure for select type", () => {
      const gpu = (config.llama_options as Record<string, Record<string, unknown>>).gpu;
      const option = gpu.split_mode as Record<string, unknown>;
      expect(typeof option.type).toBe("string");
      expect(option.type).toBe("select");
      expect(Array.isArray(option.options)).toBe(true);
    });

    it("valid option has correct field structure for boolean type", () => {
      const gpu = (config.llama_options as Record<string, Record<string, unknown>>).gpu;
      const option = gpu.mlock as Record<string, unknown>;
      expect(typeof option.type).toBe("string");
      expect(option.type).toBe("boolean");
      expect(typeof option.default).toBe("boolean");
    });
  });

  describe("option type validation", () => {
    it("valid option types are number, string, boolean, or select", () => {
      const basic = (config.llama_options as Record<string, Record<string, unknown>>).basic;
      const validTypes = ["number", "string", "boolean", "select"];
      Object.values(basic).forEach((option) => {
        const opt = option as Record<string, unknown>;
        expect(validTypes).toContain(opt.type as string);
      });
    });

    it("number type options have numeric defaults", () => {
      const basic = (config.llama_options as Record<string, Record<string, unknown>>).basic;
      const ctx_size = basic.ctx_size as Record<string, unknown>;
      expect(typeof ctx_size.default).toBe("number");
    });

    it("string type options have string defaults", () => {
      const gpu = (config.llama_options as Record<string, Record<string, unknown>>).gpu;
      const tensor_split = gpu.tensor_split as Record<string, unknown>;
      expect(tensor_split.type).toBe("string");
    });

    it("boolean type options have boolean defaults", () => {
      const gpu = (config.llama_options as Record<string, Record<string, unknown>>).gpu;
      const mlock = gpu.mlock as Record<string, unknown>;
      expect(typeof mlock.default).toBe("boolean");
    });
  });

  describe("option range validation", () => {
    it("number options with min have valid min value", () => {
      const basic = (config.llama_options as Record<string, Record<string, unknown>>).basic;
      const ctx_size = basic.ctx_size as Record<string, unknown>;
      expect(typeof ctx_size.min).toBe("number");
      expect((ctx_size.min as number) >= 0).toBe(true);
    });

    it("number options with max have valid max value", () => {
      const basic = (config.llama_options as Record<string, Record<string, unknown>>).basic;
      const ctx_size = basic.ctx_size as Record<string, unknown>;
      expect(typeof ctx_size.max).toBe("number");
      expect((ctx_size.max as number) > 0).toBe(true);
    });

    it("number options with step have valid step value", () => {
      const sampling = (config.llama_options as Record<string, Record<string, unknown>>).sampling;
      const temperature = sampling.temperature as Record<string, unknown>;
      expect(typeof temperature.step).toBe("number");
      expect((temperature.step as number) > 0).toBe(true);
    });
  });
});
