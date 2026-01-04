import { describe, it, expect } from "@jest/globals";
import { DEFAULT_LLAMA_SERVER_CONFIG } from "@/config/llama-defaults";

describe("LlamaDefaults - Edge Cases", () => {
  describe("Special Value Tests", () => {
    it("should handle -1 values for auto/unlimited settings", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.threads).toBe(-1);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.threads_batch).toBe(-1);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_predict).toBe(-1);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.seed).toBe(-1);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.gpu_layers).toBe(-1);
    });

    it("should handle empty strings for optional paths", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.api_keys).toBe("");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ssl_cert_file).toBe("");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ssl_key_file).toBe("");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.cors_allow_origins).toBe("");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.system_prompt).toBe("");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.chat_template).toBe("");
      expect(DEFAULT_LLAMA_SERVER_CONFIG.slot_save_path).toBe("");
    });

    it("should handle zero values for disabled features", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_cpu_moe).toBe(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.main_gpu).toBe(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.cache_reuse).toBe(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.max_seq_len).toBe(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.rope_freq_base).toBe(0.0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.rope_freq_scale).toBe(0.0);
    });
  });

  describe("Boolean Configuration Tests", () => {
    it("should have correct boolean states for memory options", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.embedding).toBe(false);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.memory_f16).toBe(false);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.memory_f32).toBe(false);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.memory_auto).toBe(true);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.vocab_only).toBe(false);
    });

    it("should have correct boolean states for GPU options", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.cpu_moe).toBe(false);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.no_mmap).toBe(false);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.memory_mapped).toBe(false);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.use_mmap).toBe(true);
    });

    it("should have correct boolean states for logging", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.log_colors).toBe(true);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.log_verbose).toBe(false);
    });
  });

  describe("Range Validation Tests", () => {
    it("should have valid probability ranges", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.temperature).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.temperature).toBeLessThanOrEqual(2);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.top_p).toBeGreaterThan(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.top_p).toBeLessThanOrEqual(1);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.typical_p).toBeGreaterThan(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.typical_p).toBeLessThanOrEqual(1);
    });

    it("should have valid batch sizes", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.batch_size).toBeGreaterThan(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ubatch_size).toBeGreaterThan(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.ubatch_size).toBeLessThanOrEqual(
        DEFAULT_LLAMA_SERVER_CONFIG.batch_size
      );
    });

    it("should have valid port number", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.port).toBeGreaterThan(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.port).toBeLessThanOrEqual(65535);
    });
  });

  describe("Immutability Tests", () => {
    it("should be frozen and prevent property modifications", () => {
      expect(Object.isFrozen(DEFAULT_LLAMA_SERVER_CONFIG)).toBe(true);
    });

    it("should be a readonly object", () => {
      expect(() => {
        // @ts-ignore - Testing runtime immutability
        DEFAULT_LLAMA_SERVER_CONFIG.host = "0.0.0.0";
      }).toThrow();
    });
  });
});
