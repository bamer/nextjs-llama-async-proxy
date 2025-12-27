import { DEFAULT_LLAMA_SERVER_CONFIG } from "@/config/llama-defaults";

describe("DEFAULT_LLAMA_SERVER_CONFIG", () => {
  describe("server binding configuration", () => {
    it("has correct host", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.host).toBe("127.0.0.1");
    });

    it("has correct port", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.port).toBe(8080);
    });

    it("has correct timeout", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.timeout).toBe(30000);
    });
  });

  describe("basic options", () => {
    it("has ctx_size", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ctx_size).toBe(4096);
    });

    it("has batch_size", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.batch_size).toBe(2048);
    });

    it("has ubatch_size", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ubatch_size).toBe(512);
    });

    it("has threads set to -1 (auto)", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.threads).toBe(-1);
    });

    it("has threads_batch set to -1 (auto)", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.threads_batch).toBe(-1);
    });

    it("has n_predict set to -1 (unlimited)", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_predict).toBe(-1);
    });

    it("has seed set to -1 (random)", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.seed).toBe(-1);
    });
  });

  describe("GPU options", () => {
    it("has gpu_layers set to -1 (all)", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.gpu_layers).toBe(-1);
    });

    it("has n_cpu_moe set to 0", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_cpu_moe).toBe(0);
    });

    it("has cpu_moe set to false", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.cpu_moe).toBe(false);
    });

    it("has main_gpu set to 0", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.main_gpu).toBe(0);
    });

    it("has empty tensor_split", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.tensor_split).toBe("");
    });

    it("has split_mode set to layer", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.split_mode).toBe("layer");
    });

    it("has no_mmap set to false", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.no_mmap).toBe(false);
    });

    it("has flash_attn set to auto", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.flash_attn).toBe("auto");
    });
  });

  describe("sampling parameters", () => {
    it("has temperature", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.temperature).toBe(0.7);
    });

    it("has top_k", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.top_k).toBe(40);
    });

    it("has top_p", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.top_p).toBe(0.9);
    });

    it("has min_p", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.min_p).toBe(0.0);
    });

    it("has xtc_probability", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.xtc_probability).toBe(0.0);
    });

    it("has xtc_threshold", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.xtc_threshold).toBe(0.1);
    });

    it("has typical_p", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.typical_p).toBe(1.0);
    });

    it("has repeat_last_n", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.repeat_last_n).toBe(64);
    });

    it("has repeat_penalty", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.repeat_penalty).toBe(1.0);
    });

    it("has presence_penalty", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.presence_penalty).toBe(0.0);
    });

    it("has frequency_penalty", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.frequency_penalty).toBe(0.0);
    });

    it("has dry_multiplier", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.dry_multiplier).toBe(0.0);
    });

    it("has dry_base", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.dry_base).toBe(1.75);
    });

    it("has dry_allowed_length", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.dry_allowed_length).toBe(2);
    });

    it("has dry_penalty_last_n", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.dry_penalty_last_n).toBe(20);
    });

    it("has dry_sequence_breaker", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.dry_sequence_breaker).toBe('["\\n", ":", "\\"", "*"]');
    });
  });

  describe("token limits", () => {
    it("has max_tokens", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.max_tokens).toBe(100);
    });

    it("has max_seq_len set to 0 (unlimited)", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.max_seq_len).toBe(0);
    });
  });

  describe("memory options", () => {
    it("has embedding set to false", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.embedding).toBe(false);
    });

    it("has memory_f16 set to false", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.memory_f16).toBe(false);
    });

    it("has memory_f32 set to false", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.memory_f32).toBe(false);
    });

    it("has memory_auto set to true", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.memory_auto).toBe(true);
    });

    it("has vocab_only set to false", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.vocab_only).toBe(false);
    });
  });

  describe("RoPE scaling", () => {
    it("has rope_freq_base set to 0.0 (disabled)", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.rope_freq_base).toBe(0.0);
    });

    it("has rope_freq_scale set to 0.0 (disabled)", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.rope_freq_scale).toBe(0.0);
    });

    it("has yarn_ext_factor set to 0.0", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.yarn_ext_factor).toBe(0.0);
    });

    it("has yarn_attn_factor set to 0.0", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.yarn_attn_factor).toBe(0.0);
    });

    it("has yarn_beta_fast set to 0.0", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.yarn_beta_fast).toBe(0.0);
    });

    it("has yarn_beta_slow set to 0.0", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.yarn_beta_slow).toBe(0.0);
    });
  });

  describe("security & API", () => {
    it("has empty api_keys", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.api_keys).toBe("");
    });

    it("has empty ssl_cert_file", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ssl_cert_file).toBe("");
    });

    it("has empty ssl_key_file", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ssl_key_file).toBe("");
    });

    it("has empty cors_allow_origins", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.cors_allow_origins).toBe("");
    });
  });

  describe("prompts & format", () => {
    it("has empty system_prompt", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.system_prompt).toBe("");
    });

    it("has empty chat_template", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.chat_template).toBe("");
    });
  });

  describe("logging", () => {
    it("has log_format set to text", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.log_format).toBe("text");
    });

    it("has log_level set to info", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.log_level).toBe("info");
    });

    it("has log_colors set to true", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.log_colors).toBe(true);
    });

    it("has log_verbose set to false", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.log_verbose).toBe(false);
    });
  });

  describe("cache options", () => {
    it("has cache_reuse set to 0", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.cache_reuse).toBe(0);
    });

    it("has cache_type_k set to f16", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.cache_type_k).toBe("f16");
    });

    it("has cache_type_v set to f16", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.cache_type_v).toBe("f16");
    });

    it("has ml_lock set to false", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ml_lock).toBe(false);
    });

    it("has no_kv_offload set to false", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.no_kv_offload).toBe(false);
    });
  });

  describe("additional options", () => {
    it("has n_ctx_train set to 0", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_ctx_train).toBe(0);
    });

    it("has n_embd_head set to 0", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_embd_head).toBe(0);
    });

    it("has n_embd_head_key set to 0", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_embd_head_key).toBe(0);
    });

    it("has n_warp set to 0", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_warp).toBe(0);
    });

    it("has n_expert set to 0", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_expert).toBe(0);
    });

    it("has n_expert_used set to 0", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_expert_used).toBe(0);
    });

    it("has neg_prompt_multiplier set to 1.0", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.neg_prompt_multiplier).toBe(1.0);
    });

    it("has penalize_nl set to false", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.penalize_nl).toBe(false);
    });

    it("has ignore_eos set to false", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ignore_eos).toBe(false);
    });

    it("has disable_log_all set to false", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.disable_log_all).toBe(false);
    });

    it("has enable_log_all set to false", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.enable_log_all).toBe(false);
    });

    it("has empty slot_save_path", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.slot_save_path).toBe("");
    });

    it("has memory_mapped set to false", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.memory_mapped).toBe(false);
    });

    it("has use_mmap set to true", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.use_mmap).toBe(true);
    });

    it("has mlock set to false", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.mlock).toBe(false);
    });

    it("has numa set to false", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.numa).toBe(false);
    });

    it("has numa_poll_split set to false", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.numa_poll_split).toBe(false);
    });

    it("has grp_attn_n set to 1", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.grp_attn_n).toBe(1);
    });

    it("has grp_attn_w set to 512", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.grp_attn_w).toBe(512);
    });
  });

  describe("data types", () => {
    it("has all numeric values as numbers", () => {
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.port).toBe("number");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.timeout).toBe("number");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.temperature).toBe("number");
    });

    it("has all boolean values as booleans", () => {
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.no_mmap).toBe("boolean");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.cpu_moe).toBe("boolean");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.log_colors).toBe("boolean");
    });

    it("has all string values as strings", () => {
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.host).toBe("string");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.log_format).toBe("string");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.log_level).toBe("string");
    });
  });

  describe("config immutability", () => {
    it("is defined as a constant", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG).toBeDefined();
    });

    it("has all expected properties", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty("host");
      expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty("port");
      expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty("timeout");
      expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty("ctx_size");
      expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty("batch_size");
      expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty("temperature");
      expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty("top_k");
      expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty("top_p");
      expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty("log_format");
      expect(DEFAULT_LLAMA_SERVER_CONFIG).toHaveProperty("log_level");
    });
  });
});
