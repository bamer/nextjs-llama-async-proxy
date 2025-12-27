import {
  createBackendConfig,
  createDefaultLlamaConfig,
  createModelPaths,
  createUpdateConfig,
  BACKEND_CONFIG,
  defaultLlamaConfig,
  MODEL_PATHS,
  UPDATE_CONFIG,
} from "@/server/config";

describe("Server Config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("createBackendConfig", () => {
    it("should create backend config with default values", () => {
      delete process.env.LLAMA_SERVER_BASE_URL;
      delete process.env.LLAMA_SERVER_HOST;
      delete process.env.LLAMA_SERVER_PORT;
      delete process.env.LLAMA_SERVER_TIMEOUT;

      const config = createBackendConfig();

      expect(config.LLAMA_SERVER.baseURL).toBe("http://localhost:8080");
      expect(config.LLAMA_SERVER.port).toBe(8080);
      expect(config.LLAMA_SERVER.host).toBe("localhost");
      expect(config.LLAMA_SERVER.timeout).toBe(30000);
    });

    it("should use environment variables when provided", () => {
      process.env.LLAMA_SERVER_HOST = "192.168.1.100";
      process.env.LLAMA_SERVER_PORT = "9090";
      process.env.LLAMA_SERVER_TIMEOUT = "60000";

      const config = createBackendConfig();

      expect(config.LLAMA_SERVER.baseURL).toBe("http://192.168.1.100:9090");
      expect(config.LLAMA_SERVER.port).toBe(9090);
      expect(config.LLAMA_SERVER.host).toBe("192.168.1.100");
      expect(config.LLAMA_SERVER.timeout).toBe(60000);
    });

    it("should use custom baseURL if provided", () => {
      process.env.LLAMA_SERVER_BASE_URL = "https://custom.server.com";

      const config = createBackendConfig();

      expect(config.LLAMA_SERVER.baseURL).toBe("https://custom.server.com");
    });
  });

  describe("createDefaultLlamaConfig", () => {
    it("should create default llama config with correct defaults", () => {
      const config = createDefaultLlamaConfig();

      expect(config.port).toBe(8080);
      expect(config.host).toBe("localhost");
      expect(config.timeout).toBe(30000);
      expect(config.model).toBe("");
      expect(config.context_size).toBe(2048);
      expect(config.n_ctx).toBe(2048);
      expect(config.n_batch).toBe(512);
      expect(config.n_ubatch).toBe(512);
      expect(config.n_gpu_layers).toBe(0);
      expect(config.main_gpu).toBe(0);
      expect(config.tensor_split).toBe("");
      expect(config.n_gqa).toBe(0);
      expect(config.n_threads).toBe(-1);
      expect(config.n_threads_batch).toBe(-1);
      expect(config.temperature).toBe(0.7);
      expect(config.top_k).toBe(40);
      expect(config.top_p).toBe(0.9);
      expect(config.min_p).toBe(0.0);
      expect(config.xtc_probability).toBe(0.0);
      expect(config.xtc_threshold).toBe(0.1);
      expect(config.typical_p).toBe(1.0);
      expect(config.repeat_last_n).toBe(64);
      expect(config.repeat_penalty).toBe(1.0);
      expect(config.presence_penalty).toBe(0.0);
      expect(config.frequency_penalty).toBe(0.0);
      expect(config.dry_multiplier).toBe(0.0);
      expect(config.dry_base).toBe(1.75);
      expect(config.dry_allowed_length).toBe(2);
      expect(config.dry_penalty_last_n).toBe(20);
      expect(config.dry_sequence_breaker).toBe('["\\\\n", ":", "\\"", "*"]');
      expect(config.max_tokens).toBe(100);
      expect(config.max_seq_len).toBe(0);
      expect(config.seed).toBe(-1);
      expect(config.embedding).toBe(false);
      expect(config.memory_f16).toBe(false);
      expect(config.memory_f32).toBe(false);
      expect(config.memory_auto).toBe(true);
      expect(config.vocab_only).toBe(false);
      expect(config.rope_freq_base).toBe(0.0);
      expect(config.rope_freq_scale).toBe(0.0);
      expect(config.yarn_ext_factor).toBe(0.0);
      expect(config.yarn_attn_factor).toBe(0.0);
      expect(config.yarn_beta_fast).toBe(0.0);
      expect(config.yarn_beta_slow).toBe(0.0);
      expect(config.system_prompt).toBe("");
      expect(config.chat_template).toBe("");
      expect(config.api_keys).toBe("");
      expect(config.ssl_cert_file).toBe("");
      expect(config.ssl_key_file).toBe("");
      expect(config.cors_allow_origins).toBe("");
      expect(config.log_format).toBe("text");
      expect(config.log_level).toBe("info");
      expect(config.log_colors).toBe(true);
      expect(config.log_verbose).toBe(false);
      expect(config.cache_reuse).toBe(0);
      expect(config.cache_type_k).toBe("f16");
      expect(config.cache_type_v).toBe("f16");
      expect(config.ml_lock).toBe(false);
      expect(config.no_kv_offload).toBe(false);
    });

    it("should parse boolean environment variables correctly", () => {
      process.env.LLAMA_EMBEDDING = "true";
      process.env.LLAMA_MEMORY_F16 = "true";
      process.env.LLAMA_MEMORY_AUTO = "false";
      process.env.LLAMA_VOCAB_ONLY = "false";
      process.env.LLAMA_LOG_VERBOSE = "true";

      const config = createDefaultLlamaConfig();

      expect(config.embedding).toBe(true);
      expect(config.memory_f16).toBe(true);
      expect(config.memory_auto).toBe(false);
      expect(config.vocab_only).toBe(false);
      expect(config.log_verbose).toBe(true);
    });

    it("should handle invalid port and timeout values", () => {
      process.env.LLAMA_SERVER_PORT = "invalid";
      process.env.LLAMA_SERVER_TIMEOUT = "not-a-number";

      const config = createDefaultLlamaConfig();

      expect(config.port).toBeNaN();
      expect(config.timeout).toBeNaN();
    });

    it("should use custom model path when provided", () => {
      process.env.LLAMA_MODEL = "/custom/path/to/model.gguf";

      const config = createDefaultLlamaConfig();

      expect(config.model).toBe("/custom/path/to/model.gguf");
    });
  });

  describe("createModelPaths", () => {
    it("should create model paths with default values", () => {
      delete process.env.LLAMA_MODELS_DIR;
      delete process.env.LLAMA_DEFAULT_MODEL;

      const paths = createModelPaths();

      expect(paths.modelsDir).toBe("./models");
      expect(paths.defaultModel).toBeNull();
    });

    it("should use environment variables when provided", () => {
      process.env.LLAMA_MODELS_DIR = "/custom/models";
      process.env.LLAMA_DEFAULT_MODEL = "custom-model.gguf";

      const paths = createModelPaths();

      expect(paths.modelsDir).toBe("/custom/models");
      expect(paths.defaultModel).toBe("custom-model.gguf");
    });
  });

  describe("createUpdateConfig", () => {
    it("should create update config with default values", () => {
      delete process.env.METRICS_INTERVAL;
      delete process.env.MODELS_INTERVAL;
      delete process.env.LOGS_INTERVAL;

      const config = createUpdateConfig();

      expect(config.METRICS_INTERVAL).toBe(10000);
      expect(config.MODELS_INTERVAL).toBe(30000);
      expect(config.LOGS_INTERVAL).toBe(15000);
    });

    it("should use environment variables when provided", () => {
      process.env.METRICS_INTERVAL = "5000";
      process.env.MODELS_INTERVAL = "60000";
      process.env.LOGS_INTERVAL = "20000";

      const config = createUpdateConfig();

      expect(config.METRICS_INTERVAL).toBe(5000);
      expect(config.MODELS_INTERVAL).toBe(60000);
      expect(config.LOGS_INTERVAL).toBe(20000);
    });

    it("should handle invalid interval values", () => {
      process.env.METRICS_INTERVAL = "invalid";

      const config = createUpdateConfig();

      expect(config.METRICS_INTERVAL).toBeNaN();
    });
  });

  describe("exported constants", () => {
    it("should export BACKEND_CONFIG constant", () => {
      expect(BACKEND_CONFIG).toBeDefined();
      expect(BACKEND_CONFIG.LLAMA_SERVER).toBeDefined();
      expect(typeof BACKEND_CONFIG.LLAMA_SERVER.baseURL).toBe("string");
    });

    it("should export defaultLlamaConfig constant", () => {
      expect(defaultLlamaConfig).toBeDefined();
      expect(defaultLlamaConfig.port).toBeDefined();
      expect(defaultLlamaConfig.host).toBeDefined();
    });

    it("should export MODEL_PATHS constant", () => {
      expect(MODEL_PATHS).toBeDefined();
      expect(MODEL_PATHS.modelsDir).toBeDefined();
      expect(typeof MODEL_PATHS.defaultModel === "string" || MODEL_PATHS.defaultModel === null).toBe(true);
    });

    it("should export UPDATE_CONFIG constant", () => {
      expect(UPDATE_CONFIG).toBeDefined();
      expect(UPDATE_CONFIG.METRICS_INTERVAL).toBeDefined();
      expect(UPDATE_CONFIG.MODELS_INTERVAL).toBeDefined();
      expect(UPDATE_CONFIG.LOGS_INTERVAL).toBeDefined();
    });
  });

  describe("type validation", () => {
    it("should create config objects with correct types", () => {
      const backendConfig = createBackendConfig();
      const llamaConfig = createDefaultLlamaConfig();
      const modelPaths = createModelPaths();
      const updateConfig = createUpdateConfig();

      expect(typeof backendConfig.LLAMA_SERVER.baseURL).toBe("string");
      expect(typeof backendConfig.LLAMA_SERVER.timeout).toBe("number");
      expect(typeof llamaConfig.temperature).toBe("number");
      expect(typeof llamaConfig.embedding).toBe("boolean");
      expect(typeof modelPaths.modelsDir).toBe("string");
      expect(typeof updateConfig.METRICS_INTERVAL).toBe("number");
    });
  });
});
