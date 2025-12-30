/**
 * Additional edge case and validation tests for llama-defaults.ts
 * These tests complement main llama-defaults.test.ts file
 */

import { DEFAULT_LLAMA_SERVER_CONFIG } from "@/config/llama-defaults";

describe("llama-defaults.ts - Edge Cases & Validation", () => {
  describe("Server Binding Configuration", () => {
    it("has valid host format", () => {
      const host = DEFAULT_LLAMA_SERVER_CONFIG.host;
      expect(host).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      expect(host).toBe("127.0.0.1"); // IPv4 localhost
    });

    it("has valid port in allowed range", () => {
      const port = DEFAULT_LLAMA_SERVER_CONFIG.port;
      expect(port).toBeGreaterThanOrEqual(1024); // Non-privileged
      expect(port).toBeLessThanOrEqual(65535);
      expect(port).toBe(8080);
    });

    it("has reasonable timeout value", () => {
      const timeout = DEFAULT_LLAMA_SERVER_CONFIG.timeout;
      expect(timeout).toBeGreaterThanOrEqual(5000); // At least 5 seconds
      expect(timeout).toBeLessThanOrEqual(120000); // At most 2 minutes
      expect(timeout).toBeGreaterThanOrEqual(30000); // At least 30 seconds
    });
  });

  describe("Memory Configuration", () => {
    it("has valid context size", () => {
      const ctxSize = DEFAULT_LLAMA_SERVER_CONFIG.ctx_size;
      expect(ctxSize).toBeGreaterThan(0);
      expect(ctxSize).toBeLessThanOrEqual(32768);
      expect(ctxSize).toBe(4096);
      expect(Number.isInteger(ctxSize)).toBe(true);
    });

    it("has valid batch size", () => {
      const batchSize = DEFAULT_LLAMA_SERVER_CONFIG.batch_size;
      expect(batchSize).toBeGreaterThan(0);
      expect(batchSize).toBeLessThanOrEqual(DEFAULT_LLAMA_SERVER_CONFIG.ctx_size);
      expect(batchSize).toBe(2048);
      expect(Number.isInteger(batchSize)).toBe(true);
    });

    it("has valid micro-batch size", () => {
      const ubatchSize = DEFAULT_LLAMA_SERVER_CONFIG.ubatch_size;
      expect(ubatchSize).toBeGreaterThan(0);
      expect(ubatchSize).toBeLessThanOrEqual(DEFAULT_LLAMA_SERVER_CONFIG.batch_size);
      expect(ubatchSize).toBe(512);
      expect(Number.isInteger(ubatchSize)).toBe(true);
    });
  });

  describe("Threading Configuration", () => {
    it("uses -1 for auto thread detection", () => {
      const threads = DEFAULT_LLAMA_SERVER_CONFIG.threads;
      const threadsBatch = DEFAULT_LLAMA_SERVER_CONFIG.threads_batch;

      expect(threads).toBe(-1);
      expect(threadsBatch).toBe(-1);

      // Both should use auto-detection sentinel
      expect(threads).toBe(threadsBatch);
    });
  });

  describe("Token Limits", () => {
    it("has valid max_tokens", () => {
      const maxTokens = DEFAULT_LLAMA_SERVER_CONFIG.max_tokens;
      expect(maxTokens).toBeGreaterThan(0);
      expect(maxTokens).toBe(100);
      expect(Number.isInteger(maxTokens)).toBe(true);
    });

    it("has valid max_seq_len", () => {
      const maxSeqLen = DEFAULT_LLAMA_SERVER_CONFIG.max_seq_len;
      expect(maxSeqLen).toBeGreaterThanOrEqual(0);
      expect(maxSeqLen).toBe(0); // 0 means unlimited
      expect(Number.isInteger(maxSeqLen)).toBe(true);
    });

    it("has valid n_predict", () => {
      const nPredict = DEFAULT_LLAMA_SERVER_CONFIG.n_predict;
      expect(nPredict).toBeGreaterThanOrEqual(-1);
      expect(nPredict).toBe(-1); // -1 means unlimited
      expect(Number.isInteger(nPredict)).toBe(true);
    });
  });

  describe("Sampling Parameter Ranges", () => {
    it("has valid temperature", () => {
      const temperature = DEFAULT_LLAMA_SERVER_CONFIG.temperature;
      expect(temperature).toBeGreaterThanOrEqual(0);
      expect(temperature).toBeLessThanOrEqual(2);
      expect(temperature).toBe(0.7);
    });

    it("has valid top_k", () => {
      const topK = DEFAULT_LLAMA_SERVER_CONFIG.top_k;
      expect(topK).toBeGreaterThanOrEqual(0);
      expect(topK).toBeLessThanOrEqual(200);
      expect(topK).toBe(40);
      expect(Number.isInteger(topK)).toBe(true);
    });

    it("has valid top_p", () => {
      const topP = DEFAULT_LLAMA_SERVER_CONFIG.top_p;
      expect(topP).toBeGreaterThanOrEqual(0);
      expect(topP).toBeLessThanOrEqual(1);
      expect(topP).toBe(0.9);
    });

    it("has valid min_p", () => {
      const minP = DEFAULT_LLAMA_SERVER_CONFIG.min_p;
      expect(minP).toBeGreaterThanOrEqual(0);
      expect(minP).toBeLessThanOrEqual(1);
      expect(minP).toBe(0.0);
    });

    it("has valid typical_p", () => {
      const typicalP = DEFAULT_LLAMA_SERVER_CONFIG.typical_p;
      expect(typicalP).toBeGreaterThanOrEqual(0);
      expect(typicalP).toBeLessThanOrEqual(1);
      expect(typicalP).toBe(1.0);
    });
  });

  describe("Penalty Parameters", () => {
    it("has valid repeat_penalty", () => {
      const penalty = DEFAULT_LLAMA_SERVER_CONFIG.repeat_penalty;
      expect(penalty).toBeGreaterThanOrEqual(0);
      expect(penalty).toBeLessThanOrEqual(2);
      expect(penalty).toBe(1.0);
    });

    it("has valid repeat_last_n", () => {
      const lastN = DEFAULT_LLAMA_SERVER_CONFIG.repeat_last_n;
      expect(lastN).toBeGreaterThanOrEqual(0);
      expect(lastN).toBeLessThanOrEqual(4096);
      expect(lastN).toBe(64);
      expect(Number.isInteger(lastN)).toBe(true);
    });

    it("has valid presence_penalty", () => {
      const presencePenalty = DEFAULT_LLAMA_SERVER_CONFIG.presence_penalty;
      expect(presencePenalty).toBeGreaterThanOrEqual(0);
      expect(presencePenalty).toBeLessThanOrEqual(2);
      expect(presencePenalty).toBe(0.0);
    });

    it("has valid frequency_penalty", () => {
      const freqPenalty = DEFAULT_LLAMA_SERVER_CONFIG.frequency_penalty;
      expect(freqPenalty).toBeGreaterThanOrEqual(0);
      expect(freqPenalty).toBeLessThanOrEqual(2);
      expect(freqPenalty).toBe(0.0);
    });
  });

  describe("DRY Parameters", () => {
    it("has valid dry_multiplier", () => {
      const multiplier = DEFAULT_LLAMA_SERVER_CONFIG.dry_multiplier;
      expect(multiplier).toBeGreaterThanOrEqual(0);
      expect(multiplier).toBeLessThanOrEqual(10);
      expect(multiplier).toBe(0.0);
    });

    it("has valid dry_base", () => {
      const base = DEFAULT_LLAMA_SERVER_CONFIG.dry_base;
      expect(base).toBeGreaterThanOrEqual(1);
      expect(base).toBeLessThanOrEqual(5);
      expect(base).toBe(1.75);
    });

    it("has valid dry_allowed_length", () => {
      const allowedLen = DEFAULT_LLAMA_SERVER_CONFIG.dry_allowed_length;
      expect(allowedLen).toBeGreaterThanOrEqual(0);
      expect(allowedLen).toBeLessThanOrEqual(20);
      expect(allowedLen).toBe(2);
      expect(Number.isInteger(allowedLen)).toBe(true);
    });

    it("has valid dry_penalty_last_n", () => {
      const penaltyLastN = DEFAULT_LLAMA_SERVER_CONFIG.dry_penalty_last_n;
      expect(penaltyLastN).toBeGreaterThanOrEqual(0);
      expect(penaltyLastN).toBeLessThanOrEqual(512);
      expect(penaltyLastN).toBe(20);
      expect(Number.isInteger(penaltyLastN)).toBe(true);
    });
  });

  describe("GPU Configuration", () => {
    it("has valid gpu_layers", () => {
      const gpuLayers = DEFAULT_LLAMA_SERVER_CONFIG.gpu_layers;
      expect(gpuLayers).toBeGreaterThanOrEqual(-1);
      expect(gpuLayers).toBe(-1); // -1 means all layers
      expect(Number.isInteger(gpuLayers)).toBe(true);
    });

    it("has valid main_gpu", () => {
      const mainGpu = DEFAULT_LLAMA_SERVER_CONFIG.main_gpu;
      expect(mainGpu).toBeGreaterThanOrEqual(0);
      expect(mainGpu).toBeLessThanOrEqual(16);
      expect(mainGpu).toBe(0);
      expect(Number.isInteger(mainGpu)).toBe(true);
    });

    it("has valid n_cpu_moe", () => {
      const nCpuMoe = DEFAULT_LLAMA_SERVER_CONFIG.n_cpu_moe;
      expect(nCpuMoe).toBeGreaterThanOrEqual(0);
      expect(nCpuMoe).toBeLessThanOrEqual(64);
      expect(nCpuMoe).toBe(0);
      expect(Number.isInteger(nCpuMoe)).toBe(true);
    });

    it("has valid split_mode value", () => {
      const splitMode = DEFAULT_LLAMA_SERVER_CONFIG.split_mode;
      expect(["layer", "row", "none"]).toContain(splitMode);
      expect(splitMode).toBe("layer");
    });

    it("has valid flash_attn value", () => {
      const flashAttn = DEFAULT_LLAMA_SERVER_CONFIG.flash_attn;
      expect(["auto", "enable", "disable"]).toContain(flashAttn);
      expect(flashAttn).toBe("auto");
    });
  });

  describe("RoPE Configuration", () => {
    it("has valid rope_freq_base", () => {
      const freqBase = DEFAULT_LLAMA_SERVER_CONFIG.rope_freq_base;
      expect(freqBase).toBeGreaterThanOrEqual(0);
      expect(freqBase).toBeLessThanOrEqual(1000000);
      expect(freqBase).toBe(0.0);
    });

    it("has valid rope_freq_scale", () => {
      const freqScale = DEFAULT_LLAMA_SERVER_CONFIG.rope_freq_scale;
      expect(freqScale).toBeGreaterThanOrEqual(0);
      expect(freqScale).toBeLessThanOrEqual(10);
      expect(freqScale).toBe(0.0);
    });

    it("has valid yarn_ext_factor", () => {
      const yarnExtFactor = DEFAULT_LLAMA_SERVER_CONFIG.yarn_ext_factor;
      expect(yarnExtFactor).toBeGreaterThanOrEqual(-1);
      expect(yarnExtFactor).toBeLessThanOrEqual(16);
      expect(yarnExtFactor).toBe(0.0);
    });
  });

  describe("Memory Flags", () => {
    it("has valid embedding flag", () => {
      const embedding = DEFAULT_LLAMA_SERVER_CONFIG.embedding;
      expect(typeof embedding).toBe("boolean");
      expect(embedding).toBe(false);
    });

    it("has valid memory_f16 flag", () => {
      const memoryF16 = DEFAULT_LLAMA_SERVER_CONFIG.memory_f16;
      expect(typeof memoryF16).toBe("boolean");
      expect(memoryF16).toBe(false);
    });

    it("has valid memory_f32 flag", () => {
      const memoryF32 = DEFAULT_LLAMA_SERVER_CONFIG.memory_f32;
      expect(typeof memoryF32).toBe("boolean");
      expect(memoryF32).toBe(false);
    });

    it("has valid memory_auto flag", () => {
      const memoryAuto = DEFAULT_LLAMA_SERVER_CONFIG.memory_auto;
      expect(typeof memoryAuto).toBe("boolean");
      expect(memoryAuto).toBe(true);
    });
  });

  describe("Logging Configuration", () => {
    it("has valid log_format", () => {
      const logFormat = DEFAULT_LLAMA_SERVER_CONFIG.log_format;
      expect(["text", "json"]).toContain(logFormat);
      expect(logFormat).toBe("text");
    });

    it("has valid log_level", () => {
      const logLevel = DEFAULT_LLAMA_SERVER_CONFIG.log_level;
      expect(["debug", "info", "warn", "error"]).toContain(logLevel);
      expect(logLevel).toBe("info");
    });

    it("has valid log_colors flag", () => {
      const logColors = DEFAULT_LLAMA_SERVER_CONFIG.log_colors;
      expect(typeof logColors).toBe("boolean");
      expect(logColors).toBe(true);
    });

    it("has valid log_verbose flag", () => {
      const logVerbose = DEFAULT_LLAMA_SERVER_CONFIG.log_verbose;
      expect(typeof logVerbose).toBe("boolean");
      expect(logVerbose).toBe(false);
    });
  });

  describe("Cache Configuration", () => {
    it("has valid cache_type_k", () => {
      const cacheTypeK = DEFAULT_LLAMA_SERVER_CONFIG.cache_type_k;
      const validTypes = ["f16", "f32", "q8_0", "q4_0"];
      expect(validTypes).toContain(cacheTypeK);
      expect(cacheTypeK).toBe("f16");
    });

    it("has valid cache_type_v", () => {
      const cacheTypeV = DEFAULT_LLAMA_SERVER_CONFIG.cache_type_v;
      const validTypes = ["f16", "f32", "q8_0", "q4_0"];
      expect(validTypes).toContain(cacheTypeV);
      expect(cacheTypeV).toBe("f16");
    });

    it("has valid cache_reuse", () => {
      const cacheReuse = DEFAULT_LLAMA_SERVER_CONFIG.cache_reuse;
      expect(cacheReuse).toBeGreaterThanOrEqual(0);
      expect(cacheReuse).toBeLessThanOrEqual(100);
      expect(cacheReuse).toBe(0);
      expect(Number.isInteger(cacheReuse)).toBe(true);
    });
  });

  describe("Special Sentinel Values", () => {
    it("uses -1 for auto/unlimited values appropriately", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.threads).toBe(-1);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.threads_batch).toBe(-1);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.n_predict).toBe(-1);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.gpu_layers).toBe(-1);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.seed).toBe(-1);
    });

    it("uses 0 for disabled values appropriately", () => {
      expect(DEFAULT_LLAMA_SERVER_CONFIG.max_seq_len).toBe(0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.rope_freq_base).toBe(0.0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.rope_freq_scale).toBe(0.0);
      expect(DEFAULT_LLAMA_SERVER_CONFIG.yarn_ext_factor).toBe(0.0);
    });
  });

  describe("String Validation", () => {
    it("has valid tensor_split (empty is ok)", () => {
      const tensorSplit = DEFAULT_LLAMA_SERVER_CONFIG.tensor_split;
      expect(typeof tensorSplit).toBe("string");
      // Empty is valid (auto-detection)
      expect(tensorSplit).toBe("");
    });

    it("has valid system_prompt (empty is ok)", () => {
      const sysPrompt = DEFAULT_LLAMA_SERVER_CONFIG.system_prompt;
      expect(typeof sysPrompt).toBe("string");
      // Empty is valid
      expect(sysPrompt).toBe("");
    });

    it("has valid chat_template (empty is ok)", () => {
      const chatTemplate = DEFAULT_LLAMA_SERVER_CONFIG.chat_template;
      expect(typeof chatTemplate).toBe("string");
      // Empty is valid (use default)
      expect(chatTemplate).toBe("");
    });
  });

  describe("Boolean Flag Consistency", () => {
    it("has consistent boolean memory flags", () => {
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.memory_f16).toBe("boolean");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.memory_f32).toBe("boolean");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.memory_auto).toBe("boolean");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.vocab_only).toBe("boolean");
    });

    it("has consistent boolean GPU flags", () => {
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.cpu_moe).toBe("boolean");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.no_mmap).toBe("boolean");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.use_mmap).toBe("boolean");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.mlock).toBe("boolean");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.numa).toBe("boolean");
    });

    it("has consistent boolean logging flags", () => {
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.log_colors).toBe("boolean");
      expect(typeof DEFAULT_LLAMA_SERVER_CONFIG.log_verbose).toBe("boolean");
    });
  });

  describe("Security Configuration", () => {
    it("has empty api_keys by default (no auth)", () => {
      const apiKeys = DEFAULT_LLAMA_SERVER_CONFIG.api_keys;
      expect(apiKeys).toBe("");
    });

    it("has empty ssl_cert_file by default", () => {
      const sslCert = DEFAULT_LLAMA_SERVER_CONFIG.ssl_cert_file;
      expect(sslCert).toBe("");
    });

    it("has empty ssl_key_file by default", () => {
      const sslKey = DEFAULT_LLAMA_SERVER_CONFIG.ssl_key_file;
      expect(sslKey).toBe("");
    });

    it("has empty cors_allow_origins by default", () => {
      const cors = DEFAULT_LLAMA_SERVER_CONFIG.cors_allow_origins;
      expect(cors).toBe("");
    });
  });

  describe("Configuration Consistency", () => {
    it("has consistent relationship between batch and ubatch", () => {
      const batchSize = DEFAULT_LLAMA_SERVER_CONFIG.batch_size;
      const ubatchSize = DEFAULT_LLAMA_SERVER_CONFIG.ubatch_size;
      expect(ubatchSize).toBeLessThanOrEqual(batchSize);
    });

    it("has consistent boolean negation flags", () => {
      const noMmap = DEFAULT_LLAMA_SERVER_CONFIG.no_mmap;
      const useMmap = DEFAULT_LLAMA_SERVER_CONFIG.use_mmap;
      // Shouldn't have both negation flags set
      expect(noMmap).toBe(false);
      expect(useMmap).toBe(true);
    });
  });
});
