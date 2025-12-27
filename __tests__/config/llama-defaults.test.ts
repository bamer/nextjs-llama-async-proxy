/**
 * Comprehensive tests for src/config/llama-defaults.ts
 *
 * Test Coverage Objectives:
 * - Verify all exports exist and are properly typed
 * - Test default values for all 90+ configuration properties
 * - Validate nested object structure
 * - Test immutable nature of frozen objects
 * - Verify type constraints and ranges
 */

import { DEFAULT_LLAMA_SERVER_CONFIG } from "@/config/llama-defaults";

describe("llama-defaults.ts", () => {
  describe("Export Verification", () => {
    it("should export DEFAULT_LLAMA_SERVER_CONFIG constant", () => {
      // Positive test: Verify the export exists and is an object
      expect(DEFAULT_LLAMA_SERVER_CONFIG).toBeDefined();
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG).toBe("object");
    });

    it("should have no undefined properties", () => {
      // Positive test: All properties should be defined
      const keys = Object.keys(DEFAULT_LLAMA_SERVER_CONFIG);
      expect(keys.length).toBeGreaterThan(80); // Should have 90+ properties
      keys.forEach((key) => {
        expect(DEFAULT_LLAMA_SERVER_CONFIG[key as keyof typeof DEFAULT_LLAMA_SERVER_CONFIG]).toBeDefined();
      });
    });
  });

  describe("Config Immutability", () => {
    it("should be frozen and immutable", () => {
      // Positive test: Verify the config is frozen
      expect(Object.isFrozen(DEFAULT_LLAMA_SERVER_CONFIG)).toBe(true);
    });

    it("should not allow modifying properties", () => {
      // Negative test: Verify cannot modify frozen object
      expect(() => {
        (DEFAULT_LLAMA_SERVER_CONFIG as unknown as { host: string }).host =
          "modified";
      }).toThrow();
    });

    it("should not allow adding new properties", () => {
      // Negative test: Verify cannot add properties to frozen object
      expect(() => {
        (
          DEFAULT_LLAMA_SERVER_CONFIG as unknown as Record<string, unknown>
        ).newProperty = "test";
      }).toThrow();
    });

    it("should not allow deleting properties", () => {
      // Negative test: Verify cannot delete from frozen object
      expect(() => {
        delete (
          DEFAULT_LLAMA_SERVER_CONFIG as unknown as Record<string, unknown>
        ).host;
      }).toThrow();
    });
  });

  describe("Type Validation Tests", () => {
    it("should have all expected property types", () => {
      // Positive test: Verify key property types
      const numberProps = [
        "port",
        "timeout",
        "ctx_size",
        "batch_size",
        "ubatch_size",
        "temperature",
        "top_k",
        "top_p",
      ];

      numberProps.forEach((prop) => {
        expect(
          typeof DEFAULT_LLAMA_SERVER_CONFIG[prop as keyof typeof DEFAULT_LLAMA_SERVER_CONFIG],
        ).toBe("number");
      });

      const stringProps = ["host", "log_format", "log_level"];

      stringProps.forEach((prop) => {
        expect(
          typeof DEFAULT_LLAMA_SERVER_CONFIG[prop as keyof typeof DEFAULT_LLAMA_SERVER_CONFIG],
        ).toBe("string");
      });

      const booleanProps = ["cpu_moe", "no_mmap", "log_colors"];

      booleanProps.forEach((prop) => {
        expect(
          typeof DEFAULT_LLAMA_SERVER_CONFIG[prop as keyof typeof DEFAULT_LLAMA_SERVER_CONFIG],
        ).toBe("boolean");
      });
    });

    it("should have numeric values within valid ranges", () => {
      // Positive test: Verify numeric constraints
      expect(DEFAULT_LLAMA_SERVER_CONFIG.port).toBeGreaterThan(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.port).toBeLessThanOrEqual(65535);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.temperature).toBeGreaterThanOrEqual(
        0,
      );
      expect(DEFAULT_LLAMA_SERVER_CONFIG.temperature).toBeLessThanOrEqual(2);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.top_k).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.top_p).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.top_p).toBeLessThanOrEqual(1);
    });

    it("should have valid string values for string properties", () => {
      // Positive test: Verify string properties have valid values
      expect(["text", "json"]).toContain(DEFAULT_LLAMA_SERVER_CONFIG.log_format);
      expect(["debug", "info", "warn", "error"]).toContain(
        DEFAULT_LLAMA_SERVER_CONFIG.log_level,
      );
      expect(["layer", "none"]).toContain(
        DEFAULT_LLAMA_SERVER_CONFIG.split_mode,
      );
      expect(["auto", "enable", "disable"]).toContain(
        DEFAULT_LLAMA_SERVER_CONFIG.flash_attn,
      );
      expect(["f16", "f32", "q8_0", "q4_0"]).toContain(
        DEFAULT_LLAMA_SERVER_CONFIG.cache_type_k,
      );
      expect(["f16", "f32", "q8_0", "q4_0"]).toContain(
        DEFAULT_LLAMA_SERVER_CONFIG.cache_type_v,
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle accessing non-existent properties gracefully", () => {
      // Negative test: Accessing undefined property should return undefined
      const nonExistent = (
        DEFAULT_LLAMA_SERVER_CONFIG as unknown as Record<string, unknown>
      )["nonExistentProperty"];
      expect(nonExistent).toBeUndefined();
    });

    it("should maintain special sentinel values", () => {
      // Positive test: Verify -1 is used as auto/unlimited indicator
      expect(DEFAULT_LLAMA_SERVER_CONFIG.threads).toBe(-1);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.threads_batch).toBe(-1);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_predict).toBe(-1);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.seed).toBe(-1);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.gpu_layers).toBe(-1);
    });

    it("should have empty strings for optional file paths", () => {
      // Positive test: Verify empty strings for optional paths
      expect(DEFAULT_LLAMA_SERVER_CONFIG.tensor_split).toBe("");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.api_keys).toBe("");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ssl_cert_file).toBe("");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ssl_key_file).toBe("");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.cors_allow_origins).toBe("");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.system_prompt).toBe("");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.chat_template).toBe("");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.slot_save_path).toBe("");
    });
  });

  describe("Comprehensive Property Coverage", () => {
    it("should have all server binding properties", () => {
      // Positive test: Verify all server binding properties exist
      expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty("host");
      expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty("port");
      expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty("timeout");
    });

    it("should have all basic options properties", () => {
      // Positive test: Verify all basic options exist
      const basicOptions = [
        "ctx_size",
        "batch_size",
        "ubatch_size",
        "threads",
        "threads_batch",
        "n_predict",
        "seed",
      ];

      basicOptions.forEach((prop) => {
        expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty(prop);
      });
    });

    it("should have all GPU options properties", () => {
      // Positive test: Verify all GPU options exist
      const gpuOptions = [
        "gpu_layers",
        "n_cpu_moe",
        "cpu_moe",
        "main_gpu",
        "tensor_split",
        "split_mode",
        "no_mmap",
        "flash_attn",
      ];

      gpuOptions.forEach((prop) => {
        expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty(prop);
      });
    });

    it("should have all sampling parameters", () => {
      // Positive test: Verify all sampling parameters exist
      const samplingParams = [
        "temperature",
        "top_k",
        "top_p",
        "min_p",
        "xtc_probability",
        "xtc_threshold",
        "typical_p",
        "repeat_last_n",
        "repeat_penalty",
        "presence_penalty",
        "frequency_penalty",
        "dry_multiplier",
        "dry_base",
        "dry_allowed_length",
        "dry_penalty_last_n",
        "dry_sequence_breaker",
      ];

      samplingParams.forEach((prop) => {
        expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty(prop);
      });
    });

    it("should have all token limit properties", () => {
      // Positive test: Verify token limits exist
      expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty("max_tokens");
      expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty("max_seq_len");
    });

    it("should have all memory options properties", () => {
      // Positive test: Verify all memory options exist
      const memoryOptions = [
        "embedding",
        "memory_f16",
        "memory_f32",
        "memory_auto",
        "vocab_only",
      ];

      memoryOptions.forEach((prop) => {
        expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty(prop);
      });
    });

    it("should have all RoPE scaling properties", () => {
      // Positive test: Verify all RoPE scaling options exist
      const ropeOptions = [
        "rope_freq_base",
        "rope_freq_scale",
        "yarn_ext_factor",
        "yarn_attn_factor",
        "yarn_beta_fast",
        "yarn_beta_slow",
      ];

      ropeOptions.forEach((prop) => {
        expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty(prop);
      });
    });

    it("should have all security & API properties", () => {
      // Positive test: Verify security options exist
      const securityOptions = [
        "api_keys",
        "ssl_cert_file",
        "ssl_key_file",
        "cors_allow_origins",
      ];

      securityOptions.forEach((prop) => {
        expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty(prop);
      });
    });

    it("should have all prompt & format properties", () => {
      // Positive test: Verify prompt/format options exist
      expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty("system_prompt");
      expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty("chat_template");
    });

    it("should have all logging properties", () => {
      // Positive test: Verify all logging options exist
      const loggingOptions = [
        "log_format",
        "log_level",
        "log_colors",
        "log_verbose",
      ];

      loggingOptions.forEach((prop) => {
        expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty(prop);
      });
    });

    it("should have all cache options properties", () => {
      // Positive test: Verify all cache options exist
      const cacheOptions = [
        "cache_reuse",
        "cache_type_k",
        "cache_type_v",
        "ml_lock",
        "no_kv_offload",
      ];

      cacheOptions.forEach((prop) => {
        expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty(prop);
      });
    });

    it("should have all additional options properties", () => {
      // Positive test: Verify all additional options exist
      const additionalOptions = [
        "n_ctx_train",
        "n_embd_head",
        "n_embd_head_key",
        "n_warp",
        "n_expert",
        "n_expert_used",
        "neg_prompt_multiplier",
        "penalize_nl",
        "ignore_eos",
        "disable_log_all",
        "enable_log_all",
        "slot_save_path",
        "memory_mapped",
        "use_mmap",
        "mlock",
        "numa",
        "numa_poll_split",
        "grp_attn_n",
        "grp_attn_w",
      ];

      additionalOptions.forEach((prop) => {
        expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty(prop);
      });
    });
  });

  describe("Property Count Verification", () => {
    it("should have exactly 80+ properties", () => {
      // Positive test: Verify comprehensive property coverage
      const propertyCount = Object.keys(DEFAULT_LLAMA_SERVER_CONFIG).length;
      expect(propertyCount).toBeGreaterThanOrEqual(80);
      expect(propertyCount).toBeLessThanOrEqual(110); // Reasonable upper bound
    });
  });

  describe("Default Values Verification", () => {
    it("should have correct server binding defaults", () => {
      // Positive test: Verify server binding default values
      expect(DEFAULT_LLAMA_SERVER_CONFIG.host).toBe("127.0.0.1");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.port).toBe(8080);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.timeout).toBe(30000);
    });

    it("should have correct basic options defaults", () => {
      // Positive test: Verify basic options default values
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ctx_size).toBe(4096);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.batch_size).toBe(2048);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ubatch_size).toBe(512);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.threads).toBe(-1);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.threads_batch).toBe(-1);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_predict).toBe(-1);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.seed).toBe(-1);
    });

    it("should have correct GPU options defaults", () => {
      // Positive test: Verify GPU options default values
      expect(DEFAULT_LLAMA_SERVER_CONFIG.gpu_layers).toBe(-1);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_cpu_moe).toBe(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.cpu_moe).toBe(false);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.main_gpu).toBe(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.tensor_split).toBe("");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.split_mode).toBe("layer");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.no_mmap).toBe(false);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.flash_attn).toBe("auto");
    });

    it("should have correct sampling parameter defaults", () => {
      // Positive test: Verify sampling parameter default values
      expect(DEFAULT_LLAMA_SERVER_CONFIG.temperature).toBe(0.7);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.top_k).toBe(40);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.top_p).toBe(0.9);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.min_p).toBe(0.0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.xtc_probability).toBe(0.0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.xtc_threshold).toBe(0.1);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.typical_p).toBe(1.0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.repeat_last_n).toBe(64);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.repeat_penalty).toBe(1.0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.presence_penalty).toBe(0.0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.frequency_penalty).toBe(0.0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.dry_multiplier).toBe(0.0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.dry_base).toBe(1.75);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.dry_allowed_length).toBe(2);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.dry_penalty_last_n).toBe(20);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.dry_sequence_breaker).toBe(
        '["\\n", ":", """, "*"]',
      );
    });

    it("should have correct token limit defaults", () => {
      // Positive test: Verify token limit default values
      expect(DEFAULT_LLAMA_SERVER_CONFIG.max_tokens).toBe(100);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.max_seq_len).toBe(0);
    });

    it("should have correct memory options defaults", () => {
      // Positive test: Verify memory options default values
      expect(DEFAULT_LLAMA_SERVER_CONFIG.embedding).toBe(false);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.memory_f16).toBe(false);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.memory_f32).toBe(false);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.memory_auto).toBe(true);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.vocab_only).toBe(false);
    });

    it("should have correct RoPE scaling defaults", () => {
      // Positive test: Verify RoPE scaling default values
      expect(DEFAULT_LLAMA_SERVER_CONFIG.rope_freq_base).toBe(0.0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.rope_freq_scale).toBe(0.0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.yarn_ext_factor).toBe(0.0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.yarn_attn_factor).toBe(0.0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.yarn_beta_fast).toBe(0.0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.yarn_beta_slow).toBe(0.0);
    });

    it("should have correct logging defaults", () => {
      // Positive test: Verify logging default values
      expect(DEFAULT_LLAMA_SERVER_CONFIG.log_format).toBe("text");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.log_level).toBe("info");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.log_colors).toBe(true);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.log_verbose).toBe(false);
    });

    it("should have correct cache options defaults", () => {
      // Positive test: Verify cache options default values
      expect(DEFAULT_LLAMA_SERVER_CONFIG.cache_reuse).toBe(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.cache_type_k).toBe("f16");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.cache_type_v).toBe("f16");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ml_lock).toBe(false);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.no_kv_offload).toBe(false);
    });

    it("should have correct additional options defaults", () => {
      // Positive test: Verify additional options default values
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_ctx_train).toBe(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_embd_head).toBe(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_embd_head_key).toBe(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_warp).toBe(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_expert).toBe(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_expert_used).toBe(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.neg_prompt_multiplier).toBe(1.0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.penalize_nl).toBe(false);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ignore_eos).toBe(false);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.disable_log_all).toBe(false);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.enable_log_all).toBe(false);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.slot_save_path).toBe("");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.memory_mapped).toBe(false);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.use_mmap).toBe(true);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.mlock).toBe(false);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.numa).toBe(false);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.numa_poll_split).toBe(false);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.grp_attn_n).toBe(1);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.grp_attn_w).toBe(512);
    });
  });
});
