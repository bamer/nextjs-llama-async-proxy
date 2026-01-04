import { describe, it, expect } from "@jest/globals";
import { DEFAULT_LLAMA_SERVER_CONFIG } from "@/config/llama-defaults";

describe("LlamaDefaults - Integration Tests", () => {
  describe("Configuration Completeness", () => {
    it("should have all expected configuration keys", () => {
      const expectedKeys = [
        "host",
        "port",
        "timeout",
        "ctx_size",
        "batch_size",
        "ubatch_size",
        "threads",
        "threads_batch",
        "n_predict",
        "seed",
        "gpu_layers",
        "n_cpu_moe",
        "cpu_moe",
        "main_gpu",
        "tensor_split",
        "split_mode",
        "no_mmap",
        "flash_attn",
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
        "max_tokens",
        "max_seq_len",
        "embedding",
        "memory_f16",
        "memory_f32",
        "memory_auto",
        "vocab_only",
        "rope_freq_base",
        "rope_freq_scale",
        "yarn_ext_factor",
        "yarn_attn_factor",
        "yarn_beta_fast",
        "yarn_beta_slow",
        "api_keys",
        "ssl_cert_file",
        "ssl_key_file",
        "cors_allow_origins",
        "system_prompt",
        "chat_template",
        "log_format",
        "log_level",
        "log_colors",
        "log_verbose",
        "cache_reuse",
        "cache_type_k",
        "cache_type_v",
        "ml_lock",
        "no_kv_offload",
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

      expectedKeys.forEach((key) => {
        expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty(key);
      });
    });

    it("should have consistent types for related properties", () => {
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.host).toBe("string");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.log_format).toBe("string");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.log_level).toBe("string");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.split_mode).toBe("string");

      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.port).toBe("number");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.timeout).toBe("number");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.ctx_size).toBe("number");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.batch_size).toBe("number");

      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.embedding).toBe("boolean");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.memory_f16).toBe("boolean");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.memory_f32).toBe("boolean");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.memory_auto).toBe("boolean");
    });

    it("should have valid ranges for numeric properties", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.port).toBeGreaterThan(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.port).toBeLessThanOrEqual(65535);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.timeout).toBeGreaterThan(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ctx_size).toBeGreaterThan(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.temperature).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.temperature).toBeLessThanOrEqual(2);
    });
  });
});
