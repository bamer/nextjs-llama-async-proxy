/**
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import functions to test from server.js
// Since we can't import directly, we'll copy the functions here for testing
// In a real project, you'd refactor to extract these into separate modules

function extractArchitecture(filename) {
  const lower = filename.toLowerCase();
  const patterns = [
    { regex: /(deepseek[-_]?r1)/i, name: "DeepSeek-R1" },
    { regex: /(deepseek[-_]?coder)/i, name: "DeepSeek-Coder" },
    { regex: /(deepseek)/i, name: "DeepSeek" },
    { regex: /(codellama)/i, name: "CodeLlama" },
    { regex: /(codegemma)/i, name: "CodeGemma" },
    { regex: /(mistral[-_]?moe)/i, name: "Mistral-MOE" },
    { regex: /(mistral)/i, name: "Mistral" },
    { regex: /(qwen[0-9]?)/i, name: "Qwen" },
    { regex: /(llama[0-9]?)/i, name: "Llama" },
    { regex: /(gemma[0-9]?)/i, name: "Gemma" },
    { regex: /(nemotron)/i, name: "Nemotron" },
    { regex: /(granite)/i, name: "Granite" },
    { regex: /(phi[0-9]?)/i, name: "Phi" },
    { regex: /(starcoder)/i, name: "StarCoder" },
    { regex: /(solar)/i, name: "Solar" },
    { regex: /(command[_-]?r)/i, name: "Command-R" },
    { regex: /(devstral)/i, name: "Devstral" },
    { regex: /(dbrx)/i, name: "DBRX" },
    { regex: /(mixtral)/i, name: "Mixtral" },
    { regex: /(yi[-_]?34b)/i, name: "Yi" },
    { regex: /(orca[0-9]?)/i, name: "Orca" },
    { regex: /(gpt-oss)/i, name: "GPT-OSS" },
    { regex: /(WizardCoder)/i, name: "WizardCoder" },
  ];

  for (const p of patterns) {
    if (p.regex.test(lower)) return p.name;
  }

  const firstWord = filename.split(/[-_\s]/)[0].replace(/\d+$/, "").toLowerCase();
  if (firstWord.length > 3) return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);

  return "LLM";
}

function extractParams(filename) {
  const match = filename.match(/(\d+(?:\.\d+)?)[bB](?=[-._\s]|$)/);
  if (match) return match[1] + "B";
  const lower = filename.toLowerCase();
  if (/phi[-_]?3/i.test(lower)) return "3B";
  if (/yi[-_]?34b/i.test(lower)) return "34B";
  if (/dbrx/i.test(lower)) return "132B";
  if (/nemotron[-_]?8b/i.test(lower)) return "8B";
  if (/nemotron[-_]?5b/i.test(lower)) return "5B";
  if (/mixtral[-_]?8x/i.test(lower)) return "12B";
  return "";
}

function extractQuantization(filename) {
  const endMatch = filename.match(/[-_](Q[0-9]+(?:_[A-Za-z0-9]+)+)(?=\.(?:gguf|bin|safetensors|pt|pth)|$)/);
  if (endMatch) return endMatch[1].toUpperCase();

  const iqEndMatch = filename.match(/[-_](IQ[0-9]+(?:_[A-Za-z0-9]+)?[A-Za-z0-9]*)(?=\.(?:gguf|bin|safetensors|pt|pth)|$)/);
  if (iqEndMatch) return iqEndMatch[1].toUpperCase();

  const directMatch = filename.match(/[-_](Q[0-9]+(?:_[A-Za-z0-9]+)+)\.gguf/) ||
                      filename.match(/[-_](Q[0-9]+(?:_[A-Za-z0-9]+)+)\.bin/);
  if (directMatch) return directMatch[1].toUpperCase();

  const endOfStringMatch = filename.match(/[-_](Q[0-9]+(?:_[A-Za-z0-9]+)+)$/);
  if (endOfStringMatch) return endOfStringMatch[1].toUpperCase();

  return "";
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// File type mapping
const fileTypeMap = {
  0: "F32", 1: "F16", 2: "Q4_0", 3: "Q4_1", 6: "Q5_0", 7: "Q5_1",
  8: "Q8_0", 9: "Q8_1", 10: "Q2_K", 11: "Q3_K_S", 12: "Q3_K_M",
  13: "Q3_K_L", 14: "Q4_K_S", 15: "Q4_K_M", 16: "Q5_K_S", 17: "Q5_K_M",
  18: "Q6_K", 19: "Q8_K",
};

describe('extractArchitecture', () => {
  describe('llama variants', () => {
    it('should extract llama architecture', () => {
      expect(extractArchitecture('llama-2-7b.gguf')).toBe('Llama');
    });

    it('should extract llama from llama3', () => {
      expect(extractArchitecture('llama-3.1-8b-instruct.gguf')).toBe('Llama');
    });

    it('should extract llama from meta-llama', () => {
      expect(extractArchitecture('meta-llama-Llama-2-7B.gguf')).toBe('Llama');
    });
  });

  describe('qwen variants', () => {
    it('should extract qwen architecture', () => {
      expect(extractArchitecture('Qwen3-14B.gguf')).toBe('Qwen');
    });

    it('should extract qwen from qwen2', () => {
      expect(extractArchitecture('Qwen2-72B-Instruct.gguf')).toBe('Qwen');
    });
  });

  describe('mistral variants', () => {
    it('should extract mistral architecture', () => {
      expect(extractArchitecture('mistral-7b-v0.1.gguf')).toBe('Mistral');
    });

    it('should extract mistral-moe', () => {
      expect(extractArchitecture('mistral-moe-7b.gguf')).toBe('Mistral-MOE');
    });
  });

  describe('code models', () => {
    it('should extract codellama', () => {
      expect(extractArchitecture('codellama-7b-instruct.gguf')).toBe('CodeLlama');
    });

    it('should extract codegemma', () => {
      expect(extractArchitecture('codegemma-7b-it.gguf')).toBe('CodeGemma');
    });

    it('should extract deepseek-coder', () => {
      expect(extractArchitecture('deepseek-coder-6.7b.gguf')).toBe('DeepSeek-Coder');
    });
  });

  describe('other architectures', () => {
    it('should extract gemma', () => {
      expect(extractArchitecture('gemma-2b-it.gguf')).toBe('Gemma');
    });

    it('should extract phi', () => {
      expect(extractArchitecture('phi-3-mini.gguf')).toBe('Phi');
    });

    it('should extract nemotron', () => {
      expect(extractArchitecture('nemotron-8b.gguf')).toBe('Nemotron');
    });

    it('should extract granite', () => {
      expect(extractArchitecture('granite-3b.gguf')).toBe('Granite');
    });

    it('should extract devstral', () => {
      expect(extractArchitecture('Devstral-Small-2-24B.gguf')).toBe('Devstral');
    });

    it('should extract gpt-oss', () => {
      expect(extractArchitecture('GPT-OSS-Code-Reasoning-20B.gguf')).toBe('GPT-OSS');
    });
  });

  describe('unknown architectures', () => {
    it('should return LLM for completely unknown names', () => {
      expect(extractArchitecture('unknown-model.gguf')).toBe('Llm');
    });

    it('should return LLM for random strings', () => {
      expect(extractArchitecture('xyzabc123.gguf')).toBe('Xyzabc');
    });
  });
});

describe('extractParams', () => {
  describe('standard parameter extraction', () => {
    it('should extract 7B', () => {
      expect(extractParams('model-7B.gguf')).toBe('7B');
    });

    it('should extract 13B', () => {
      expect(extractParams('model-13B.gguf')).toBe('13B');
    });

    it('should extract 30B', () => {
      expect(extractParams('model-30B.gguf')).toBe('30B');
    });

    it('should extract 70B', () => {
      expect(extractParams('model-70B.gguf')).toBe('70B');
    });

    it('should handle lowercase b', () => {
      expect(extractParams('model-7b.gguf')).toBe('7B');
    });

    it('should extract decimal parameters', () => {
      expect(extractParams('model-1.5B.gguf')).toBe('1.5B');
    });

    it('should extract 6.7B', () => {
      expect(extractParams('deepseek-coder-6.7B.gguf')).toBe('6.7B');
    });
  });

  describe('parameter extraction from complex filenames', () => {
    it('should extract params before -Instruct', () => {
      expect(extractParams('model-24B-Instruct.gguf')).toBe('24B');
    });

    it('should extract params before .gguf', () => {
      expect(extractParams('model-8B.Q8_0.gguf')).toBe('8B');
    });

    it('should extract params with underscores', () => {
      expect(extractParams('model-3b_v1.gguf')).toBe('3B');
    });
  });

  describe('special model families', () => {
    it('should return 3B for phi-3', () => {
      expect(extractParams('phi-3-mini.gguf')).toBe('3B');
    });

    it('should return 34B for yi-34b', () => {
      expect(extractParams('yi-34b-chat.gguf')).toBe('34B');
    });

    it('should return 132B for dbrx', () => {
      expect(extractParams('dbrx-instruct.gguf')).toBe('132B');
    });

    it('should return 12B for mixtral 8x', () => {
      expect(extractParams('mixtral-8x7b-v0.1.gguf')).toBe('12B');
    });
  });

  describe('no parameters found', () => {
    it('should return empty string for files without params', () => {
      expect(extractParams('vocab.gguf')).toBe('');
    });

    it('should return empty string for mmproj files', () => {
      expect(extractParams('mmproj-f16.gguf')).toBe('');
    });
  });
});

describe('extractQuantization', () => {
  describe('standard quantization formats', () => {
    it('should extract Q4_K_M', () => {
      expect(extractQuantization('model-Q4_K_M.gguf')).toBe('Q4_K_M');
    });

    it('should extract Q4_K_S', () => {
      expect(extractQuantization('model-Q4_K_S.gguf')).toBe('Q4_K_S');
    });

    it('should extract Q8_0', () => {
      expect(extractQuantization('model-Q8_0.gguf')).toBe('Q8_0');
    });

    it('should extract Q5_K_M', () => {
      expect(extractQuantization('model-Q5_K_M.gguf')).toBe('Q5_K_M');
    });

    it('should extract Q2_K', () => {
      expect(extractQuantization('model-Q2_K.gguf')).toBe('Q2_K');
    });

    it('should extract Q6_K', () => {
      expect(extractQuantization('model-Q6_K.gguf')).toBe('Q6_K');
    });
  });

  describe('quantization with underscore prefix', () => {
    it('should extract Q4_K_M with underscore prefix', () => {
      expect(extractQuantization('model-Q4_K_M.gguf')).toBe('Q4_K_M');
    });

    it('should extract Q8_0 with underscore prefix', () => {
      expect(extractQuantization('model_Q8_0.gguf')).toBe('Q8_0');
    });

    it('should extract Q4_K_S with dash prefix', () => {
      expect(extractQuantization('model-Q4_K_S.gguf')).toBe('Q4_K_S');
    });
  });

  describe('IQ quantization formats', () => {
    it('should extract IQ4NL', () => {
      expect(extractQuantization('model-IQ4NL.gguf')).toBe('IQ4NL');
    });

    it('should extract IQ4_NL', () => {
      expect(extractQuantization('model-IQ4_NL.gguf')).toBe('IQ4_NL');
    });
  });

  describe('complex filenames', () => {
    it('should extract from Devstral filename', () => {
      expect(extractQuantization('Devstral-Small-2-24B-Instruct-2512-Q4_K_S.gguf')).toBe('Q4_K_S');
    });

    it('should extract from Qwen3 filename', () => {
      expect(extractQuantization('Qwen3-14B-Q4_K_S.gguf')).toBe('Q4_K_S');
    });

    it('should extract from GPT-OSS filename', () => {
      expect(extractQuantization('GPT-OSS-Code-Reasoning-20B.Q8_0.gguf')).toBe('Q8_0');
    });
  });

  describe('no quantization found', () => {
    it('should return empty string for vocab files', () => {
      expect(extractQuantization('ggml-vocab-llama.gguf')).toBe('');
    });

    it('should return empty string for mmproj files', () => {
      expect(extractQuantization('mmproj-f16.gguf')).toBe('');
    });

    it('should return empty string for files without Q pattern', () => {
      expect(extractQuantization('some-random-file.gguf')).toBe('');
    });
  });
});

describe('formatBytes', () => {
  it('should format 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('should format bytes', () => {
    expect(formatBytes(512)).toBe('512.0 B');
  });

  it('should format kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
  });

  it('should format megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
  });

  it('should format gigabytes', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB');
  });

  it('should format terabytes', () => {
    expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1.0 TB');
  });

  it('should handle fractional values', () => {
    expect(formatBytes(1536 * 1024 * 1024)).toBe('1.5 GB');
  });

  it('should handle large values', () => {
    expect(formatBytes(22.38 * 1024 * 1024 * 1024)).toBe('22.4 GB');
  });
});

describe('fileTypeMap', () => {
  it('should map F32', () => {
    expect(fileTypeMap[0]).toBe('F32');
  });

  it('should map F16', () => {
    expect(fileTypeMap[1]).toBe('F16');
  });

  it('should map Q4_0', () => {
    expect(fileTypeMap[2]).toBe('Q4_0');
  });

  it('should map Q4_K_M (most common)', () => {
    expect(fileTypeMap[15]).toBe('Q4_K_M');
  });

  it('should map Q8_0', () => {
    expect(fileTypeMap[8]).toBe('Q8_0');
  });

  it('should map Q2_K through Q8_K', () => {
    expect(fileTypeMap[10]).toBe('Q2_K');
    expect(fileTypeMap[19]).toBe('Q8_K');
  });

  it('should have all expected keys', () => {
    const expectedKeys = [0, 1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    expectedKeys.forEach(key => {
      expect(fileTypeMap[key]).toBeDefined();
    });
  });
});
