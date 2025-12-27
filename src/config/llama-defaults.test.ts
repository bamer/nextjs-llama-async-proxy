import { describe, it, expect } from "@jest/globals";
import { DEFAULT_LLAMA_SERVER_CONFIG } from "../llama-defaults";

describe("LlamaDefaults", () => {
  describe("Basic Structure", () => {
    it("should be defined", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG).toBeDefined();
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG).toBe("object");
    });

    it("should be a const object", () => {
      expect(Object.isFrozen(DEFAULT_LLAMA_SERVER_CONFIG)).toBe(true);
    });
  });

  describe("Server Binding Configuration", () => {
    it("should have correct host", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.host).toBe("127.0.0.1");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.host).toBe("string");
    });

    it("should have correct port", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.port).toBe(8080);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.port).toBe("number");
    });

    it("should have correct timeout", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.timeout).toBe(30000);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.timeout).toBe("number");
    });
  });

  describe("Basic Options", () => {
    it("should have ctx_size", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ctx_size).toBe(4096);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.ctx_size).toBe("number");
    });

    it("should have batch_size", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.batch_size).toBe(2048);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.batch_size).toBe("number");
    });

    it("should have ubatch_size", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ubatch_size).toBe(512);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.ubatch_size).toBe("number");
    });

    it("should have threads set to -1 (auto)", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.threads).toBe(-1);
    });

    it("should have threads_batch set to -1 (auto)", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.threads_batch).toBe(-1);
    });

    it("should have n_predict set to -1 (unlimited)", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_predict).toBe(-1);
    });

    it("should have seed set to -1 (random)", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.seed).toBe(-1);
    });
  });

  describe("GPU Options", () => {
    it("should have gpu_layers set to -1 (all)", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.gpu_layers).toBe(-1);
    });

    it("should have n_cpu_moe", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_cpu_moe).toBe(0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.n_cpu_moe).toBe("number");
    });

    it("should have cpu_moe disabled", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.cpu_moe).toBe(false);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.cpu_moe).toBe("boolean");
    });

    it("should have main_gpu", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.main_gpu).toBe(0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.main_gpu).toBe("number");
    });

    it("should have empty tensor_split string", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.tensor_split).toBe("");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.tensor_split).toBe("string");
    });

    it("should have split_mode", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.split_mode).toBe("layer");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.split_mode).toBe("string");
    });

    it("should have no_mmap disabled", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.no_mmap).toBe(false);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.no_mmap).toBe("boolean");
    });

    it("should have flash_attn set to auto", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.flash_attn).toBe("auto");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.flash_attn).toBe("string");
    });
  });

  describe("Sampling Parameters", () => {
    it("should have temperature", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.temperature).toBe(0.7);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.temperature).toBe("number");
    });

    it("should have top_k", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.top_k).toBe(40);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.top_k).toBe("number");
    });

    it("should have top_p", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.top_p).toBe(0.9);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.top_p).toBe("number");
    });

    it("should have min_p", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.min_p).toBe(0.0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.min_p).toBe("number");
    });

    it("should have xtc_probability", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.xtc_probability).toBe(0.0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.xtc_probability).toBe("number");
    });

    it("should have xtc_threshold", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.xtc_threshold).toBe(0.1);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.xtc_threshold).toBe("number");
    });

    it("should have typical_p", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.typical_p).toBe(1.0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.typical_p).toBe("number");
    });

    it("should have repeat_last_n", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.repeat_last_n).toBe(64);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.repeat_last_n).toBe("number");
    });

    it("should have repeat_penalty", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.repeat_penalty).toBe(1.0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.repeat_penalty).toBe("number");
    });

    it("should have presence_penalty", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.presence_penalty).toBe(0.0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.presence_penalty).toBe("number");
    });

    it("should have frequency_penalty", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.frequency_penalty).toBe(0.0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.frequency_penalty).toBe("number");
    });

    it("should have dry_multiplier", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.dry_multiplier).toBe(0.0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.dry_multiplier).toBe("number");
    });

    it("should have dry_base", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.dry_base).toBe(1.75);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.dry_base).toBe("number");
    });

    it("should have dry_allowed_length", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.dry_allowed_length).toBe(2);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.dry_allowed_length).toBe("number");
    });

    it("should have dry_penalty_last_n", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.dry_penalty_last_n).toBe(20);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.dry_penalty_last_n).toBe("number");
    });

    it("should have dry_sequence_breaker", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.dry_sequence_breaker).toBe('["\\n", ":", "\"", "*"]');
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.dry_sequence_breaker).toBe("string");
    });
  });

  describe("Token Limits", () => {
    it("should have max_tokens", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.max_tokens).toBe(100);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.max_tokens).toBe("number");
    });

    it("should have max_seq_len", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.max_seq_len).toBe(0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.max_seq_len).toBe("number");
    });
  });

  describe("Memory Options", () => {
    it("should have embedding disabled", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.embedding).toBe(false);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.embedding).toBe("boolean");
    });

    it("should have memory_f16 disabled", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.memory_f16).toBe(false);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.memory_f16).toBe("boolean");
    });

    it("should have memory_f32 disabled", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.memory_f32).toBe(false);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.memory_f32).toBe("boolean");
    });

    it("should have memory_auto enabled", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.memory_auto).toBe(true);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.memory_auto).toBe("boolean");
    });

    it("should have vocab_only disabled", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.vocab_only).toBe(false);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.vocab_only).toBe("boolean");
    });
  });

  describe("RoPE Scaling", () => {
    it("should have rope_freq_base", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.rope_freq_base).toBe(0.0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.rope_freq_base).toBe("number");
    });

    it("should have rope_freq_scale", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.rope_freq_scale).toBe(0.0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.rope_freq_scale).toBe("number");
    });

    it("should have yarn_ext_factor", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.yarn_ext_factor).toBe(0.0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.yarn_ext_factor).toBe("number");
    });

    it("should have yarn_attn_factor", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.yarn_attn_factor).toBe(0.0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.yarn_attn_factor).toBe("number");
    });

    it("should have yarn_beta_fast", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.yarn_beta_fast).toBe(0.0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.yarn_beta_fast).toBe("number");
    });

    it("should have yarn_beta_slow", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.yarn_beta_slow).toBe(0.0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.yarn_beta_slow).toBe("number");
    });
  });

  describe("Security & API", () => {
    it("should have empty api_keys", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.api_keys).toBe("");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.api_keys).toBe("string");
    });

    it("should have empty ssl_cert_file", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ssl_cert_file).toBe("");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.ssl_cert_file).toBe("string");
    });

    it("should have empty ssl_key_file", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ssl_key_file).toBe("");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.ssl_key_file).toBe("string");
    });

    it("should have empty cors_allow_origins", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.cors_allow_origins).toBe("");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.cors_allow_origins).toBe("string");
    });
  });

  describe("Prompts & Format", () => {
    it("should have empty system_prompt", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.system_prompt).toBe("");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.system_prompt).toBe("string");
    });

    it("should have empty chat_template", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.chat_template).toBe("");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.chat_template).toBe("string");
    });
  });

  describe("Logging", () => {
    it("should have log_format", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.log_format).toBe("text");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.log_format).toBe("string");
    });

    it("should have log_level", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.log_level).toBe("info");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.log_level).toBe("string");
    });

    it("should have log_colors enabled", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.log_colors).toBe(true);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.log_colors).toBe("boolean");
    });

    it("should have log_verbose disabled", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.log_verbose).toBe(false);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.log_verbose).toBe("boolean");
    });
  });

  describe("Cache Options", () => {
    it("should have cache_reuse", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.cache_reuse).toBe(0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.cache_reuse).toBe("number");
    });

    it("should have cache_type_k", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.cache_type_k).toBe("f16");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.cache_type_k).toBe("string");
    });

    it("should have cache_type_v", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.cache_type_v).toBe("f16");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.cache_type_v).toBe("string");
    });

    it("should have ml_lock disabled", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ml_lock).toBe(false);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.ml_lock).toBe("boolean");
    });

    it("should have no_kv_offload disabled", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.no_kv_offload).toBe(false);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.no_kv_offload).toBe("boolean");
    });
  });

  describe("Additional Options", () => {
    it("should have n_ctx_train", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_ctx_train).toBe(0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.n_ctx_train).toBe("number");
    });

    it("should have n_embd_head", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_embd_head).toBe(0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.n_embd_head).toBe("number");
    });

    it("should have n_embd_head_key", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_embd_head_key).toBe(0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.n_embd_head_key).toBe("number");
    });

    it("should have n_warp", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_warp).toBe(0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.n_warp).toBe("number");
    });

    it("should have n_expert", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_expert).toBe(0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.n_expert).toBe("number");
    });

    it("should have n_expert_used", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_expert_used).toBe(0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.n_expert_used).toBe("number");
    });

    it("should have neg_prompt_multiplier", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.neg_prompt_multiplier).toBe(1.0);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.neg_prompt_multiplier).toBe("number");
    });

    it("should have penalize_nl disabled", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.penalize_nl).toBe(false);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.penalize_nl).toBe("boolean");
    });

    it("should have ignore_eos disabled", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ignore_eos).toBe(false);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.ignore_eos).toBe("boolean");
    });

    it("should have disable_log_all disabled", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.disable_log_all).toBe(false);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.disable_log_all).toBe("boolean");
    });

    it("should have enable_log_all disabled", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.enable_log_all).toBe(false);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.enable_log_all).toBe("boolean");
    });

    it("should have empty slot_save_path", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.slot_save_path).toBe("");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.slot_save_path).toBe("string");
    });

    it("should have memory_mapped disabled", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.memory_mapped).toBe(false);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.memory_mapped).toBe("boolean");
    });

    it("should have use_mmap enabled", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.use_mmap).toBe(true);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.use_mmap).toBe("boolean");
    });

    it("should have mlock disabled", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.mlock).toBe(false);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.mlock).toBe("boolean");
    });

    it("should have numa disabled", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.numa).toBe(false);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.numa).toBe("boolean");
    });

    it("should have numa_poll_split disabled", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.numa_poll_split).toBe(false);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.numa_poll_split).toBe("boolean");
    });

    it("should have grp_attn_n", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.grp_attn_n).toBe(1);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.grp_attn_n).toBe("number");
    });

    it("should have grp_attn_w", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.grp_attn_w).toBe(512);
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.grp_attn_w).toBe("number");
    });
  });

  describe("Configuration Completeness", () => {
    it("should have all expected configuration keys", () => {
      const expectedKeys = [
        "host", "port", "timeout",
        "ctx_size", "batch_size", "ubatch_size", "threads", "threads_batch", "n_predict", "seed",
        "gpu_layers", "n_cpu_moe", "cpu_moe", "main_gpu", "tensor_split", "split_mode",
        "no_mmap", "flash_attn",
        "temperature", "top_k", "top_p", "min_p", "xtc_probability", "xtc_threshold",
        "typical_p", "repeat_last_n", "repeat_penalty", "presence_penalty", "frequency_penalty",
        "dry_multiplier", "dry_base", "dry_allowed_length", "dry_penalty_last_n", "dry_sequence_breaker",
        "max_tokens", "max_seq_len",
        "embedding", "memory_f16", "memory_f32", "memory_auto", "vocab_only",
        "rope_freq_base", "rope_freq_scale", "yarn_ext_factor", "yarn_attn_factor",
        "yarn_beta_fast", "yarn_beta_slow",
        "api_keys", "ssl_cert_file", "ssl_key_file", "cors_allow_origins",
        "system_prompt", "chat_template",
        "log_format", "log_level", "log_colors", "log_verbose",
        "cache_reuse", "cache_type_k", "cache_type_v", "ml_lock", "no_kv_offload",
        "n_ctx_train", "n_embd_head", "n_embd_head_key", "n_warp", "n_expert", "n_expert_used",
        "neg_prompt_multiplier", "penalize_nl", "ignore_eos", "disable_log_all", "enable_log_all",
        "slot_save_path", "memory_mapped", "use_mmap", "mlock", "numa", "numa_poll_split",
        "grp_attn_n", "grp_attn_w"
      ];

      expectedKeys.forEach((key) => {
        expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty(key);
      });
    });
  });
});
