/**
 * @jest-environment node
 */

/**
 * Tests for server/gguf/index.js (barrel file)
 * Tests that all exports from sub-modules are properly re-exported
 */

import { jest } from "@jest/globals";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("gguf/index.js barrel file", () => {
  let fileTypeMap,
    parseGgufHeaderSync,
    parseGgufMetadata,
    extractArchitecture,
    extractParams,
    extractQuantization,
    _validateGgufExports;

  beforeAll(async () => {
    const module = await import("/home/bamer/nextjs-llama-async-proxy/server/gguf/index.js");
    fileTypeMap = module.fileTypeMap;
    parseGgufHeaderSync = module.parseGgufHeaderSync;
    parseGgufMetadata = module.parseGgufMetadata;
    extractArchitecture = module.extractArchitecture;
    extractParams = module.extractParams;
    extractQuantization = module.extractQuantization;
    _validateGgufExports = module._validateGgufExports;
  });

  describe("constants re-exported from constants.js", () => {
    test("should export fileTypeMap object", () => {
      expect(fileTypeMap).toBeDefined();
      expect(typeof fileTypeMap).toBe("object");
      expect(fileTypeMap[0]).toBe("F32");
      expect(fileTypeMap[1]).toBe("F16");
      expect(fileTypeMap[2]).toBe("Q4_0");
      expect(fileTypeMap[3]).toBe("Q4_1");
      expect(fileTypeMap[6]).toBe("Q5_0");
      expect(fileTypeMap[7]).toBe("Q5_1");
      expect(fileTypeMap[8]).toBe("Q8_0");
      expect(fileTypeMap[9]).toBe("Q8_1");
      expect(fileTypeMap[10]).toBe("Q2_K");
      expect(fileTypeMap[19]).toBe("Q8_K");
    });

    test("fileTypeMap should have all expected quantization types", () => {
      expect(fileTypeMap[14]).toBe("Q4_K_S");
      expect(fileTypeMap[15]).toBe("Q4_K_M");
      expect(fileTypeMap[16]).toBe("Q5_K_S");
      expect(fileTypeMap[17]).toBe("Q5_K_M");
      expect(fileTypeMap[18]).toBe("Q6_K");
    });
  });

  describe("parseGgufHeaderSync re-exported from header-parser.js", () => {
    test("should parse valid GGUF header", () => {
      const testFile = path.join(__dirname, "test-header-barrel.gguf");
      const buffer = Buffer.alloc(24);
      const view = new DataView(buffer.buffer);
      view.setUint32(0, 0x46554747, true); // GGUF magic
      view.setUint32(4, 3, true);
      view.setBigUint64(8, 0n, true);
      view.setBigUint64(16, 0n, true);
      fs.writeFileSync(testFile, buffer);
      try {
        const result = parseGgufHeaderSync(testFile);
        expect(result).not.toBeNull();
        expect(result.architecture).toBe("");
      } finally {
        fs.unlinkSync(testFile);
      }
    });

    test("should return null for invalid magic", () => {
      const testFile = path.join(__dirname, "test-bad-barrel.gguf");
      const buffer = Buffer.alloc(24);
      const view = new DataView(buffer.buffer);
      view.setUint32(0, 0xdeadbeef, true);
      view.setUint32(4, 3, true);
      fs.writeFileSync(testFile, buffer);
      try {
        const result = parseGgufHeaderSync(testFile);
        expect(result).toBeNull();
      } finally {
        fs.unlinkSync(testFile);
      }
    });

    test("should return null for non-existent file", () => {
      const result = parseGgufHeaderSync("/non/existent/barrel.gguf");
      expect(result).toBeNull();
    });
  });

  describe("extractArchitecture re-exported from filename-parser.js", () => {
    test("should detect DeepSeek-R1", () => {
      expect(extractArchitecture("deepseek-r1-7b-q4_k_m.gguf")).toBe("DeepSeek-R1");
    });
    test("should detect DeepSeek-Coder", () => {
      expect(extractArchitecture("deepseek-coder-6.7b-q4_0.gguf")).toBe("DeepSeek-Coder");
    });
    test("should detect CodeLlama", () => {
      expect(extractArchitecture("codellama-7b-python-q4_0.gguf")).toBe("CodeLlama");
    });
    test("should detect Llama", () => {
      expect(extractArchitecture("llama3-8b-instruct-q4_0.gguf")).toBe("Llama");
    });
    test("should detect Gemma", () => {
      expect(extractArchitecture("gemma-7b-it-q4_0.gguf")).toBe("Gemma");
    });
    test("should detect Mistral-MOE", () => {
      expect(extractArchitecture("mistral-moe-7b-v0.1-q4_0.gguf")).toBe("Mistral-MOE");
    });
    test("should detect Mixtral", () => {
      expect(extractArchitecture("mixtral-8x7b-v0.1-q4_k_m.gguf")).toBe("Mixtral");
    });
    test("should return LLM for unknown", () => {
      expect(extractArchitecture("unknown-model.gguf")).toBe("LLM");
    });
    test("should be case insensitive", () => {
      expect(extractArchitecture("LLAMA3-8B-Q4_0.gguf")).toBe("Llama");
    });
    test("should detect Command-R", () => {
      expect(extractArchitecture("command-r-35b-q4_0.gguf")).toBe("Command-R");
    });
    test("should detect DBRX", () => {
      expect(extractArchitecture("dbrx-instruct-q4_0.gguf")).toBe("DBRX");
    });
    test("should detect Granite", () => {
      expect(extractArchitecture("granite-3b-instruct-q4_0.gguf")).toBe("Granite");
    });
    test("should detect Nemotron", () => {
      expect(extractArchitecture("nemotron-8b-instruct-q4_0.gguf")).toBe("Nemotron");
    });
    test("should detect Phi", () => {
      expect(extractArchitecture("phi-3-mini-4k-instruct-q4_0.gguf")).toBe("Phi");
    });
    test("should detect Qwen", () => {
      expect(extractArchitecture("qwen2.5-7b-instruct-q4_0.gguf")).toBe("Qwen");
    });
    test("should detect Solar", () => {
      expect(extractArchitecture("solar-10.7b-instruct-q4_0.gguf")).toBe("Solar");
    });
    test("should detect StarCoder", () => {
      expect(extractArchitecture("starcoder-15b-q4_0.gguf")).toBe("StarCoder");
    });
    test("should detect Yi", () => {
      expect(extractArchitecture("yi-34b-chat-q4_0.gguf")).toBe("Yi");
    });
    test("should detect Orca", () => {
      expect(extractArchitecture("orca-2-7b-q4_0.gguf")).toBe("Orca");
    });
  });

  describe("extractParams re-exported from filename-parser.js", () => {
    test("should extract 7B", () => {
      expect(extractParams("llama3-7b-instruct-q4_0.gguf")).toBe("7B");
    });
    test("should extract 13B", () => {
      expect(extractParams("llama2-13b-chat-q4_0.gguf")).toBe("13B");
    });
    test("should extract 34B", () => {
      expect(extractParams("qwen-34b-chat-q4_0.gguf")).toBe("34B");
    });
    test("should handle Phi-3 special case", () => {
      expect(extractParams("phi-3-mini-4k-instruct-q4_0.gguf")).toBe("3B");
    });
    test("should handle Yi-34b special case", () => {
      expect(extractParams("yi-34b-chat-q4_0.gguf")).toBe("34B");
    });
    test("should handle DBRX special case", () => {
      expect(extractParams("dbrx-instruct-q4_0.gguf")).toBe("132B");
    });
    test("should handle Nemotron-8b special case", () => {
      expect(extractParams("nemotron-8b-instruct-q4_0.gguf")).toBe("8B");
    });
    test("should handle Nemotron-5b special case", () => {
      expect(extractParams("nemotron-5b-instruct-q4_0.gguf")).toBe("5B");
    });
    test("should extract 7B from mixtral-8x7b", () => {
      // Note: mixtral-8x7b pattern matches 7B first due to regex order
      expect(extractParams("mixtral-8x7b-v0.1-q4_0.gguf")).toBe("7B");
    });
    test("should return empty for no params", () => {
      expect(extractParams("model.gguf")).toBe("");
    });
    test("should handle decimal params", () => {
      expect(extractParams("model-2.5b-q4_0.gguf")).toBe("2.5B");
    });
  });

  describe("extractQuantization re-exported from filename-parser.js", () => {
    test("should extract Q4_K_M", () => {
      expect(extractQuantization("model-7b-q4_k_m.gguf")).toBe("Q4_K_M");
    });
    test("should extract Q8_0", () => {
      expect(extractQuantization("model-7b-q8_0.gguf")).toBe("Q8_0");
    });
    test("should extract Q4_0", () => {
      expect(extractQuantization("model-7b-q4_0.gguf")).toBe("Q4_0");
    });
    test("should extract Q2_K", () => {
      expect(extractQuantization("model-7b-q2_k.gguf")).toBe("Q2_K");
    });
    test("should extract Q5_K_S", () => {
      expect(extractQuantization("model-7b-q5_k_s.gguf")).toBe("Q5_K_S");
    });
    test("should extract Q5_K_M", () => {
      expect(extractQuantization("model-7b-q5_k_m.gguf")).toBe("Q5_K_M");
    });
    test("should extract Q6_K", () => {
      expect(extractQuantization("model-7b-q6_k.gguf")).toBe("Q6_K");
    });
    test("should extract IQ4_NL quantization", () => {
      expect(extractQuantization("model-7b-IQ4_NL.gguf")).toBe("IQ4_NL");
    });
    test("should return empty for no quantization", () => {
      expect(extractQuantization("model.gguf")).toBe("");
    });
    test("should be case insensitive", () => {
      expect(extractQuantization("model-7b-Q4_K_M.gguf")).toBe("Q4_K_M");
    });
    test("should extract from end of filename before extension", () => {
      expect(extractQuantization("model-q8_0.bin")).toBe("Q8_0");
    });
  });

  describe("_validateGgufExports barrel validation", () => {
    test("should export _validateGgufExports function", () => {
      expect(_validateGgufExports).toBeDefined();
      expect(typeof _validateGgufExports).toBe("function");
    });

    test("_validateGgufExports should return true when called", () => {
      const result = _validateGgufExports();
      expect(result).toBe(true);
    });

    test("_validateGgufExports should be idempotent", () => {
      const result1 = _validateGgufExports();
      const result2 = _validateGgufExports();
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe("parseGgufMetadata re-exported from metadata-parser.js", () => {
    test("should parse metadata from valid file", async () => {
      const testFile = path.join(__dirname, "test-meta-barrel.gguf");
      const buffer = Buffer.alloc(200);
      const view = new DataView(buffer.buffer);

      view.setUint32(0, 0x46554747, true);
      view.setUint32(4, 3, true);
      view.setBigUint64(8, 0n, true);
      view.setBigUint64(16, 1n, true);

      let offset = 24;
      view.setBigUint64(offset, 22n, true);
      offset += 8;
      buffer.write("general.architecture", offset, "utf8");
      offset += 22;
      view.setUint32(offset, 8, true);
      offset += 4;
      view.setBigUint64(offset, 6n, true);
      offset += 8;
      buffer.write("llama", offset, "utf8");
      offset += 6;

      fs.writeFileSync(testFile, buffer.slice(0, offset));
      try {
        const result = await parseGgufMetadata(testFile);
        expect(result).not.toBeNull();
        expect(result.size).toBe(offset);
      } finally {
        fs.unlinkSync(testFile);
      }
    });

    test("should fallback to filename parsing for invalid file", async () => {
      const testFile = path.join(__dirname, "test-model-barrel.gguf");
      fs.writeFileSync(testFile, "INVALID");
      try {
        const result = await parseGgufMetadata(testFile);
        expect(result).not.toBeNull();
      } finally {
        fs.unlinkSync(testFile);
      }
    });

    test("should handle non-existent file", async () => {
      const result = await parseGgufMetadata("/non/existent/barrel-meta.gguf");
      expect(result).not.toBeNull();
      expect(result.architecture).toBe("LLM");
    });

    test("should handle files with size 0", async () => {
      const testFile = path.join(__dirname, "test-empty-barrel.gguf");
      fs.writeFileSync(testFile, "");
      try {
        const result = await parseGgufMetadata(testFile);
        expect(result).not.toBeNull();
      } finally {
        fs.unlinkSync(testFile);
      }
    });
  });
});
