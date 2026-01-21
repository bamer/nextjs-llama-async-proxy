/**
 * @jest-environment node
 */

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Copy functions from gguf-parser.js to test
// This approach follows the pattern used in metadata.test.js

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
  const endMatch = filename.match(
    /[-_](Q[0-9]+[_A-Z0-9]*)(?=\.(?:gguf|bin|safetensors|pt|pth)|$)/i
  );
  if (endMatch) return endMatch[1].toUpperCase();

  const iqEndMatch = filename.match(
    /[-_](IQ[0-9]+(?:_[A-Za-z0-9]+)?[A-Za-z0-9]*)(?=\.(?:gguf|bin|safetensors|pt|pth)|$)/
  );
  if (iqEndMatch) return iqEndMatch[1].toUpperCase();

  const directMatch =
    filename.match(/[-_](Q[0-9]+[_A-Z0-9]*)\.gguf/i) ||
    filename.match(/[-_](Q[0-9]+[_A-Z0-9]*)\.bin/i);
  if (directMatch) return directMatch[1].toUpperCase();

  const endOfStringMatch = filename.match(/[-_](Q[0-9]+[_A-Z0-9]*)$/i);
  if (endOfStringMatch) return endOfStringMatch[1].toUpperCase();

  return "";
}

const fileTypeMap = {
  0: "F32",
  1: "F16",
  2: "Q4_0",
  3: "Q4_1",
  6: "Q5_0",
  7: "Q5_1",
  8: "Q8_0",
  9: "Q8_1",
  10: "Q2_K",
  11: "Q3_K_S",
  12: "Q3_K_M",
  13: "Q3_K_L",
  14: "Q4_K_S",
  15: "Q4_K_M",
  16: "Q5_K_S",
  17: "Q5_K_M",
  18: "Q6_K",
  19: "Q8_K",
};

describe("extractArchitecture", () => {
  describe("llama variants", () => {
    it("should extract llama architecture", () => {
      // This test verifies that llama architecture is correctly identified
      // from various filename formats containing "llama"
      expect(extractArchitecture("llama-2-7b.gguf")).toBe("Llama");
    });

    it("should extract llama from llama3", () => {
      // This test verifies llama3 variant detection
      expect(extractArchitecture("llama-3.1-8b-instruct.gguf")).toBe("Llama");
    });

    it("should extract llama from meta-llama prefix", () => {
      // This test verifies detection when "llama" is in the model name
      // with a vendor prefix like "meta-llama-"
      expect(extractArchitecture("meta-llama-Llama-2-7B.gguf")).toBe("Llama");
    });

    it("should handle llama3.2 naming", () => {
      // This test verifies llama version 3.2 naming pattern
      expect(extractArchitecture("Llama-3.2-90B-Vision-Instruct.gguf")).toBe("Llama");
    });
  });

  describe("qwen variants", () => {
    it("should extract qwen architecture", () => {
      // This test verifies Qwen architecture detection
      expect(extractArchitecture("Qwen3-14B.gguf")).toBe("Qwen");
    });

    it("should extract qwen from qwen2", () => {
      // This test verifies Qwen2 variant detection
      expect(extractArchitecture("Qwen2-72B-Instruct.gguf")).toBe("Qwen");
    });

    it("should extract qwen from qwen1.5", () => {
      // This test verifies Qwen 1.5 variant naming
      expect(extractArchitecture("Qwen1.5-14B-Chat.gguf")).toBe("Qwen");
    });
  });

  describe("mistral variants", () => {
    it("should extract mistral architecture", () => {
      // This test verifies Mistral architecture detection
      expect(extractArchitecture("mistral-7b-v0.1.gguf")).toBe("Mistral");
    });

    it("should extract mistral-moe", () => {
      // This test verifies Mistral-MOE (Mixture of Experts) detection
      expect(extractArchitecture("mistral-moe-7b.gguf")).toBe("Mistral-MOE");
    });

    it("should handle mixtral as separate architecture", () => {
      // This test verifies Mixtral is detected as its own architecture
      // even though it's related to Mistral
      expect(extractArchitecture("Mixtral-8x7b-v0.1.gguf")).toBe("Mixtral");
    });
  });

  describe("code models", () => {
    it("should extract codellama", () => {
      // This test verifies CodeLlama architecture detection
      expect(extractArchitecture("codellama-7b-instruct.gguf")).toBe("CodeLlama");
    });

    it("should extract codegemma", () => {
      // This test verifies CodeGemma architecture detection
      expect(extractArchitecture("codegemma-7b-it.gguf")).toBe("CodeGemma");
    });

    it("should extract deepseek-coder", () => {
      // This test verifies DeepSeek-Coder detection
      expect(extractArchitecture("deepseek-coder-6.7b.gguf")).toBe("DeepSeek-Coder");
    });

    it("should extract deepseek-r1 reasoning model", () => {
      // This test verifies DeepSeek-R1 (reasoning) variant detection
      expect(extractArchitecture("deepseek-r1-70b.gguf")).toBe("DeepSeek-R1");
    });

    it("should extract deepseek base architecture", () => {
      // This test verifies generic DeepSeek architecture detection
      // when not a specific variant
      expect(extractArchitecture("deepseek-7b-base.gguf")).toBe("DeepSeek");
    });

    it("should extract starcoder", () => {
      // This test verifies StarCoder architecture detection
      expect(extractArchitecture("starcoder-15b.gguf")).toBe("StarCoder");
    });

    it("should extract wizardcoder", () => {
      // This test verifies WizardCoder architecture detection
      expect(extractArchitecture("WizardCoder-Python-13B-V1.0.gguf")).toBe("WizardCoder");
    });
  });

  describe("other architectures", () => {
    it("should extract gemma", () => {
      // This test verifies Gemma architecture detection
      expect(extractArchitecture("gemma-2b-it.gguf")).toBe("Gemma");
    });

    it("should extract gemma2 variant", () => {
      // This test verifies Gemma 2 variant detection
      expect(extractArchitecture("gemma2-27b-it.gguf")).toBe("Gemma");
    });

    it("should extract phi", () => {
      // This test verifies Phi architecture detection
      expect(extractArchitecture("phi-3-mini.gguf")).toBe("Phi");
    });

    it("should extract phi2", () => {
      // This test verifies Phi-2 variant detection
      expect(extractArchitecture("phi-2.gguf")).toBe("Phi");
    });

    it("should extract nemotron", () => {
      // This test verifies Nemotron architecture detection
      expect(extractArchitecture("nemotron-8b.gguf")).toBe("Nemotron");
    });

    it("should extract granite", () => {
      // This test verifies Granite architecture detection
      expect(extractArchitecture("granite-3b.gguf")).toBe("Granite");
    });

    it("should extract command-r", () => {
      // This test verifies Command-R architecture detection
      expect(extractArchitecture("command-r-35b.gguf")).toBe("Command-R");
    });

    it("should extract devstral", () => {
      // This test verifies Devstral architecture detection
      expect(extractArchitecture("Devstral-Small-2-24B.gguf")).toBe("Devstral");
    });

    it("should extract dbrx", () => {
      // This test verifies DBRX architecture detection
      expect(extractArchitecture("dbrx-instruct.gguf")).toBe("DBRX");
    });

    it("should extract orca", () => {
      // This test verifies Orca architecture detection
      expect(extractArchitecture("orca-2-13b.gguf")).toBe("Orca");
    });

    it("should extract gpt-oss", () => {
      // This test verifies GPT-OSS architecture detection
      expect(extractArchitecture("GPT-OSS-Code-Reasoning-20B.gguf")).toBe("GPT-OSS");
    });

    it("should extract solar", () => {
      // This test verifies Solar architecture detection
      expect(extractArchitecture("solar-10.7b-instruct-v1.0.gguf")).toBe("Solar");
    });

    it("should extract yi-34b", () => {
      // This test verifies Yi architecture detection
      // for the specific 34B variant
      expect(extractArchitecture("yi-34b-chat.gguf")).toBe("Yi");
    });

    it("should extract yi-34b with underscore", () => {
      // This test verifies Yi architecture with underscore separator
      expect(extractArchitecture("yi_34b.gguf")).toBe("Yi");
    });
  });

  describe("unknown architectures", () => {
    it("should return LLM for completely unknown names", () => {
      // This test verifies that unknown architectures return "LLM"
      // as a generic fallback
      expect(extractArchitecture("unknown-model.gguf")).toBe("LLM");
    });

    it("should return LLM for random strings", () => {
      // This test verifies random strings get LLM fallback
      expect(extractArchitecture("xyzabc123.gguf")).toBe("LLM");
    });

    it("should return Llama for vocabulary files with llama name", () => {
      // This test verifies vocabulary files containing model names are detected
      // ggml-vocab-llama contains "llama" so it returns "Llama"
      expect(extractArchitecture("ggml-vocab-llama.gguf")).toBe("Llama");
    });

    it("should return LLM for generic mmproj files", () => {
      // This test verifies mmproj (multimodal projection) files get LLM fallback
      expect(extractArchitecture("mmproj-f16.gguf")).toBe("LLM");
    });
  });

  describe("case sensitivity", () => {
    it("should be case insensitive for all patterns", () => {
      // This test verifies the extraction is truly case-insensitive
      // by testing various case combinations
      expect(extractArchitecture("LLAMA-7B.gguf")).toBe("Llama");
      expect(extractArchitecture("MISTRAL-7B.GGUF")).toBe("Mistral");
      expect(extractArchitecture("QWEN2-72B.GGUF")).toBe("Qwen");
      expect(extractArchitecture("DeepSeek-Coder-6.7B.GGUF")).toBe("DeepSeek-Coder");
    });

    it("should handle mixed case variations", () => {
      // This test verifies mixed case handling
      // Note: "MiXTrAl" matches "mixtral" pattern before "mistral"
      expect(extractArchitecture("LlAmA-3-7B.gguf")).toBe("Llama");
      expect(extractArchitecture("MiXTrAl-7B.gguf")).toBe("Mixtral");
    });
  });

  describe("priority of patterns", () => {
    it("should prioritize deepseek-r1 over generic deepseek", () => {
      // This test verifies that more specific patterns (deepseek-r1)
      // take precedence over generic patterns (deepseek)
      expect(extractArchitecture("deepseek-r1-70b.gguf")).toBe("DeepSeek-R1");
    });

    it("should prioritize deepseek-coder over generic deepseek", () => {
      // This test verifies coder variant takes precedence
      expect(extractArchitecture("deepseek-coder-6.7b.gguf")).toBe("DeepSeek-Coder");
    });

    it("should prioritize mistral-moe over generic mistral", () => {
      // This test verifies MOE variant takes precedence
      expect(extractArchitecture("mistral-moe-7b.gguf")).toBe("Mistral-MOE");
    });

    it("should prioritize codellama over generic llama", () => {
      // This test verifies code-specific variant takes precedence
      expect(extractArchitecture("codellama-7b-instruct.gguf")).toBe("CodeLlama");
    });

    it("should prioritize codegemma over generic gemma", () => {
      // This test verifies code-specific Gemma variant
      expect(extractArchitecture("codegemma-7b-it.gguf")).toBe("CodeGemma");
    });
  });
});

describe("extractParams", () => {
  describe("standard parameter extraction", () => {
    it("should extract 7B", () => {
      // This test verifies standard 7B parameter extraction
      expect(extractParams("model-7B.gguf")).toBe("7B");
    });

    it("should extract 13B", () => {
      // This test verifies standard 13B parameter extraction
      expect(extractParams("model-13B.gguf")).toBe("13B");
    });

    it("should extract 30B", () => {
      // This test verifies 30B parameter extraction
      expect(extractParams("model-30B.gguf")).toBe("30B");
    });

    it("should extract 70B", () => {
      // This test verifies 70B parameter extraction (large model)
      expect(extractParams("model-70B.gguf")).toBe("70B");
    });

    it("should handle lowercase b", () => {
      // This test verifies lowercase 'b' is accepted
      expect(extractParams("model-7b.gguf")).toBe("7B");
    });

    it("should extract decimal parameters", () => {
      // This test verifies decimal parameter sizes (1.5B, etc.)
      expect(extractParams("model-1.5B.gguf")).toBe("1.5B");
    });

    it("should extract 6.7B", () => {
      // This test verifies common decimal size like 6.7B
      expect(extractParams("deepseek-coder-6.7B.gguf")).toBe("6.7B");
    });
  });

  describe("parameter extraction from complex filenames", () => {
    it("should extract params before -Instruct", () => {
      // This test verifies extraction works when params precede
      // instruction marker
      expect(extractParams("model-24B-Instruct.gguf")).toBe("24B");
    });

    it("should extract params before .gguf", () => {
      // This test verifies extraction works when params are
      // followed directly by quantization
      expect(extractParams("model-8B.Q8_0.gguf")).toBe("8B");
    });

    it("should extract params with underscores", () => {
      // This test verifies extraction with underscore separators
      expect(extractParams("model-3b_v1.gguf")).toBe("3B");
    });

    it("should handle multiple numeric values", () => {
      // This test verifies only the parameter size is extracted
      // when there are multiple numbers in the filename
      expect(extractParams("model-7B-v1.0-fp16.gguf")).toBe("7B");
    });
  });

  describe("special model families", () => {
    it("should return 3B for phi-3", () => {
      // This test verifies Phi-3 special case returns 3B
      // even though it doesn't have explicit 3B in name
      expect(extractParams("phi-3-mini.gguf")).toBe("3B");
    });

    it("should return 3B for phi-3.5", () => {
      // This test verifies Phi-3.5 variant also returns 3B
      expect(extractParams("phi-3.5-mini-instruct.gguf")).toBe("3B");
    });

    it("should return 34B for yi-34b", () => {
      // This test verifies Yi-34B special case returns 34B
      // even though "34" would match the regex
      expect(extractParams("yi-34b-chat.gguf")).toBe("34B");
    });

    it("should return 34B for yi-34b with underscore", () => {
      // This test verifies Yi-34B with underscore separator
      expect(extractParams("yi_34b.gguf")).toBe("34B");
    });

    it("should return 132B for dbrx", () => {
      // This test verifies DBRX special case returns 132B
      // the actual parameter count for DBRX
      expect(extractParams("dbrx-instruct.gguf")).toBe("132B");
    });

    it("should return 8B for nemotron-8b", () => {
      // This test verifies Nemotron 8B special case
      expect(extractParams("nemotron-8b.gguf")).toBe("8B");
    });

    it("should return 5B for nemotron-5b", () => {
      // This test verifies Nemotron 5B special case
      expect(extractParams("nemotron-5b.gguf")).toBe("5B");
    });

    it("should extract standard params for mixtral 8x7b", () => {
      // This test verifies Mixtral 8x7B - the parameter size is extracted
      // from the standard regex pattern. The special case for "8x" prefix
      // only applies when no parameter size is found in the filename.
      expect(extractParams("mixtral-8x7b-v0.1.gguf")).toBe("7B");
    });
  });

  describe("no parameters found", () => {
    it("should return empty string for files without params", () => {
      // This test verifies empty string returned for vocab files
      expect(extractParams("vocab.gguf")).toBe("");
    });

    it("should return empty string for mmproj files", () => {
      // This test verifies empty string for multimodal projection files
      expect(extractParams("mmproj-f16.gguf")).toBe("");
    });

    it("should return empty string for files with no size indicator", () => {
      // This test verifies empty string for files without B suffix
      expect(extractParams("some-random-file.gguf")).toBe("");
    });

    it("should return empty string for tokenizer files", () => {
      // This test verifies tokenizer-only files return empty
      expect(extractParams("tokenizer.json")).toBe("");
    });
  });

  describe("edge cases", () => {
    it("should not confuse byte with billion", () => {
      // This test verifies only 'B' (billion parameters) is matched
      // not 'b' (bytes) in other contexts
      expect(extractParams("model-1024mb.gguf")).toBe("");
    });

    it("should handle version numbers correctly", () => {
      // This test verifies version numbers like v1.0 don't confuse
      // parameter extraction
      expect(extractParams("model-7B-v1.0.gguf")).toBe("7B");
    });

    it("should extract from complex multi-part names", () => {
      // This test verifies extraction from complex names like
      // Meta's naming convention
      expect(extractParams("meta-llama-Llama-2-7B-chat-hf.gguf")).toBe("7B");
    });
  });
});

describe("extractQuantization", () => {
  describe("standard quantization formats", () => {
    it("should extract Q4_K_M", () => {
      // This test verifies Q4_K_M (most common) extraction
      expect(extractQuantization("model-Q4_K_M.gguf")).toBe("Q4_K_M");
    });

    it("should extract Q4_K_S", () => {
      // This test verifies Q4_K_S (smaller variant) extraction
      expect(extractQuantization("model-Q4_K_S.gguf")).toBe("Q4_K_S");
    });

    it("should extract Q8_0", () => {
      // This test verifies Q8_0 (near-float) extraction
      expect(extractQuantization("model-Q8_0.gguf")).toBe("Q8_0");
    });

    it("should extract Q5_K_M", () => {
      // This test verifies Q5_K_M extraction
      expect(extractQuantization("model-Q5_K_M.gguf")).toBe("Q5_K_M");
    });

    it("should extract Q5_K_S", () => {
      // This test verifies Q5_K_S extraction
      expect(extractQuantization("model-Q5_K_S.gguf")).toBe("Q5_K_S");
    });

    it("should extract Q2_K", () => {
      // This test verifies Q2_K (smallest K-quant) extraction
      expect(extractQuantization("model-Q2_K.gguf")).toBe("Q2_K");
    });

    it("should extract Q6_K", () => {
      // This test verifies Q6_K extraction
      expect(extractQuantization("model-Q6_K.gguf")).toBe("Q6_K");
    });

    it("should extract Q8_K", () => {
      // This test verifies Q8_K extraction
      expect(extractQuantization("model-Q8_K.gguf")).toBe("Q8_K");
    });
  });

  describe("legacy quantization formats", () => {
    it("should extract Q4_0", () => {
      // This test verifies legacy Q4_0 extraction
      expect(extractQuantization("model-Q4_0.gguf")).toBe("Q4_0");
    });

    it("should extract Q4_1", () => {
      // This test verifies legacy Q4_1 extraction
      expect(extractQuantization("model-Q4_1.gguf")).toBe("Q4_1");
    });

    it("should extract Q5_0", () => {
      // This test verifies legacy Q5_0 extraction
      expect(extractQuantization("model-Q5_0.gguf")).toBe("Q5_0");
    });

    it("should extract Q5_1", () => {
      // This test verifies legacy Q5_1 extraction
      expect(extractQuantization("model-Q5_1.gguf")).toBe("Q5_1");
    });

    it("should extract Q8_1", () => {
      // This test verifies Q8_1 extraction
      expect(extractQuantization("model-Q8_1.gguf")).toBe("Q8_1");
    });
  });

  describe("quantization with different separators", () => {
    it("should extract with dash prefix", () => {
      // This test verifies extraction with dash separator
      expect(extractQuantization("model-Q4_K_M.gguf")).toBe("Q4_K_M");
    });

    it("should extract with underscore prefix", () => {
      // This test verifies extraction with underscore separator
      expect(extractQuantization("model_Q8_0.gguf")).toBe("Q8_0");
    });

    it("should handle multiple underscores in quantization", () => {
      // This test verifies complex quantization names with multiple underscores
      expect(extractQuantization("model-Q3_K_XS.gguf")).toBe("Q3_K_XS");
    });
  });

  describe("IQ quantization formats", () => {
    it("should extract IQ4NL", () => {
      // This test verifies IQ4NL (improved 4-bit) extraction
      expect(extractQuantization("model-IQ4NL.gguf")).toBe("IQ4NL");
    });

    it("should extract IQ4_NL with underscore", () => {
      // This test verifies IQ4_NL variant extraction
      expect(extractQuantization("model-IQ4_NL.gguf")).toBe("IQ4_NL");
    });

    it("should extract IQ3_M", () => {
      // This test verifies IQ3_M extraction
      expect(extractQuantization("model-IQ3_M.gguf")).toBe("IQ3_M");
    });

    it("should extract IQ2_XXS", () => {
      // This test verifies IQ2_XXS extraction
      expect(extractQuantization("model-IQ2_XXS.gguf")).toBe("IQ2_XXS");
    });

    it("should extract IQ3_XS", () => {
      // This test verifies IQ3_XS extraction
      expect(extractQuantization("model-IQ3_XS.gguf")).toBe("IQ3_XS");
    });

    it("should extract IQ2_S", () => {
      // This test verifies IQ2_S extraction
      expect(extractQuantization("model-IQ2_S.gguf")).toBe("IQ2_S");
    });

    it("should extract IQ1_S", () => {
      // This test verifies IQ1_S extraction
      expect(extractQuantization("model-IQ1_S.gguf")).toBe("IQ1_S");
    });
  });

  describe("K-quantization sub-types", () => {
    it("should extract Q3_K variants", () => {
      // This test verifies all Q3_K sub-type extractions
      expect(extractQuantization("model-Q3_K_S.gguf")).toBe("Q3_K_S");
      expect(extractQuantization("model-Q3_K_M.gguf")).toBe("Q3_K_M");
      expect(extractQuantization("model-Q3_K_L.gguf")).toBe("Q3_K_L");
    });

    it("should extract Q4_K variants", () => {
      // This test verifies all Q4_K sub-type extractions
      expect(extractQuantization("model-Q4_K_S.gguf")).toBe("Q4_K_S");
      expect(extractQuantization("model-Q4_K_M.gguf")).toBe("Q4_K_M");
    });

    it("should extract Q5_K variants", () => {
      // This test verifies all Q5_K sub-type extractions
      expect(extractQuantization("model-Q5_K_S.gguf")).toBe("Q5_K_S");
      expect(extractQuantization("model-Q5_K_M.gguf")).toBe("Q5_K_M");
    });
  });

  describe("complex filenames", () => {
    it("should extract from Devstral filename", () => {
      // This test verifies extraction from complex model names
      expect(extractQuantization("Devstral-Small-2-24B-Instruct-2512-Q4_K_S.gguf")).toBe("Q4_K_S");
    });

    it("should extract from Qwen3 filename", () => {
      // This test verifies extraction from Qwen3 naming
      expect(extractQuantization("Qwen3-14B-Q4_K_S.gguf")).toBe("Q4_K_S");
    });

    it("should extract from GPT-OSS filename", () => {
      // This test verifies extraction with underscore before quantization
      expect(extractQuantization("GPT-OSS-Code-Reasoning-20B_Q8_0.gguf")).toBe("Q8_0");
    });

    it("should extract from DeepSeek-R1 filename", () => {
      // This test verifies extraction from DeepSeek reasoning model
      expect(extractQuantization("DeepSeek-R1-70B-Q4_K_M.gguf")).toBe("Q4_K_M");
    });

    it("should extract from mixtral filename", () => {
      // This test verifies extraction from Mixtral model
      expect(extractQuantization("Mixtral-8x7B-v0.1-Q5_K_M.gguf")).toBe("Q5_K_M");
    });

    it("should extract from Command-R filename", () => {
      // This test verifies extraction from Command-R model
      expect(extractQuantization("Command-R-35B-Q8_0.gguf")).toBe("Q8_0");
    });
  });

  describe("no quantization found", () => {
    it("should return empty string for vocab files", () => {
      // This test verifies vocab files return empty quantization
      expect(extractQuantization("ggml-vocab-llama.gguf")).toBe("");
    });

    it("should return empty string for mmproj files", () => {
      // This test verifies mmproj files return empty quantization
      expect(extractQuantization("mmproj-f16.gguf")).toBe("");
    });

    it("should return empty string for files without Q pattern", () => {
      // This test verifies random files without Q pattern return empty
      expect(extractQuantization("some-random-file.gguf")).toBe("");
    });

    it("should return empty string for float16 files", () => {
      // This test verifies float16 (f16) doesn't match Q pattern
      expect(extractQuantization("model-f16.gguf")).toBe("");
    });

    it("should return empty string for float32 files", () => {
      // This test verifies float32 (f32) doesn't match Q pattern
      expect(extractQuantization("model-f32.gguf")).toBe("");
    });

    it("should extract quantization even without file extension", () => {
      // This test verifies extraction works when file has no extension
      // The end-of-string pattern matches quantization before end of filename
      expect(extractQuantization("model-Q4_K_M")).toBe("Q4_K_M");
    });
  });

  describe("case handling", () => {
    it("should be case insensitive for Q patterns", () => {
      // This test verifies quantization extraction is case insensitive
      expect(extractQuantization("model-q4_k_m.gguf")).toBe("Q4_K_M");
      expect(extractQuantization("model-Q8_0.GGUF")).toBe("Q8_0");
    });

    it("should handle mixed case IQ patterns", () => {
      // This test verifies IQ patterns are case sensitive for "IQ" prefix
      // Lowercase "iq" doesn't match the uppercase pattern
      expect(extractQuantization("model-IQ4_NL.gguf")).toBe("IQ4_NL");
      expect(extractQuantization("model-iq4_nl.gguf")).toBe("");
    });
  });

  describe("file extensions", () => {
    it("should extract before .gguf", () => {
      // This test verifies extraction works with .gguf extension
      expect(extractQuantization("model-Q4_K_M.gguf")).toBe("Q4_K_M");
    });

    it("should extract before .bin", () => {
      // This test verifies extraction works with .bin extension
      expect(extractQuantization("model-Q4_K_M.bin")).toBe("Q4_K_M");
    });

    it("should extract before .safetensors", () => {
      // This test verifies extraction works with .safetensors extension
      expect(extractQuantization("model-Q8_0.safetensors")).toBe("Q8_0");
    });

    it("should extract before .pt", () => {
      // This test verifies extraction works with .pt extension
      expect(extractQuantization("model-Q5_K_M.pt")).toBe("Q5_K_M");
    });

    it("should extract before .pth", () => {
      // This test verifies extraction works with .pth extension
      expect(extractQuantization("model-Q6_K.pth")).toBe("Q6_K");
    });

    it("should extract with no extension (end of string)", () => {
      // This test verifies extraction works with no file extension
      expect(extractQuantization("model-Q4_K_M")).toBe("Q4_K_M");
    });
  });
});

describe("fileTypeMap", () => {
  describe("F32 and F16 mappings", () => {
    it("should map 0 to F32", () => {
      // This test verifies float32 mapping
      expect(fileTypeMap[0]).toBe("F32");
    });

    it("should map 1 to F16", () => {
      // This test verifies float16 mapping
      expect(fileTypeMap[1]).toBe("F16");
    });
  });

  describe("Q4 mappings", () => {
    it("should map 2 to Q4_0", () => {
      // This test verifies legacy Q4_0 mapping
      expect(fileTypeMap[2]).toBe("Q4_0");
    });

    it("should map 3 to Q4_1", () => {
      // This test verifies legacy Q4_1 mapping
      expect(fileTypeMap[3]).toBe("Q4_1");
    });

    it("should map 14 to Q4_K_S", () => {
      // This test verifies Q4_K_S (small) mapping
      expect(fileTypeMap[14]).toBe("Q4_K_S");
    });

    it("should map 15 to Q4_K_M", () => {
      // This test verifies Q4_K_M (medium) mapping - most common
      expect(fileTypeMap[15]).toBe("Q4_K_M");
    });
  });

  describe("Q5 mappings", () => {
    it("should map 6 to Q5_0", () => {
      // This test verifies legacy Q5_0 mapping
      expect(fileTypeMap[6]).toBe("Q5_0");
    });

    it("should map 7 to Q5_1", () => {
      // This test verifies legacy Q5_1 mapping
      expect(fileTypeMap[7]).toBe("Q5_1");
    });

    it("should map 16 to Q5_K_S", () => {
      // This test verifies Q5_K_S mapping
      expect(fileTypeMap[16]).toBe("Q5_K_S");
    });

    it("should map 17 to Q5_K_M", () => {
      // This test verifies Q5_K_M mapping
      expect(fileTypeMap[17]).toBe("Q5_K_M");
    });
  });

  describe("Q8 mappings", () => {
    it("should map 8 to Q8_0", () => {
      // This test verifies Q8_0 mapping (near-float)
      expect(fileTypeMap[8]).toBe("Q8_0");
    });

    it("should map 9 to Q8_1", () => {
      // This test verifies Q8_1 mapping
      expect(fileTypeMap[9]).toBe("Q8_1");
    });

    it("should map 19 to Q8_K", () => {
      // This test verifies Q8_K mapping
      expect(fileTypeMap[19]).toBe("Q8_K");
    });
  });

  describe("Q2 and Q3 mappings", () => {
    it("should map 10 to Q2_K", () => {
      // This test verifies Q2_K (smallest K-quant) mapping
      expect(fileTypeMap[10]).toBe("Q2_K");
    });

    it("should map 11 to Q3_K_S", () => {
      // This test verifies Q3_K_S mapping
      expect(fileTypeMap[11]).toBe("Q3_K_S");
    });

    it("should map 12 to Q3_K_M", () => {
      // This test verifies Q3_K_M mapping
      expect(fileTypeMap[12]).toBe("Q3_K_M");
    });

    it("should map 13 to Q3_K_L", () => {
      // This test verifies Q3_K_L (large) mapping
      expect(fileTypeMap[13]).toBe("Q3_K_L");
    });
  });

  describe("Q6 mapping", () => {
    it("should map 18 to Q6_K", () => {
      // This test verifies Q6_K mapping
      expect(fileTypeMap[18]).toBe("Q6_K");
    });
  });

  describe("completeness verification", () => {
    it("should have all expected file type keys", () => {
      // This test verifies all file type integers have mappings
      const expectedKeys = [0, 1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      expectedKeys.forEach((key) => {
        expect(fileTypeMap[key]).toBeDefined();
        expect(typeof fileTypeMap[key]).toBe("string");
      });
    });

    it("should not have gaps in file type mapping", () => {
      // This test verifies there are no missing file type values
      // in the expected range
      const allKeys = Object.keys(fileTypeMap)
        .map(Number)
        .sort((a, b) => a - b);
      const expectedSequence = [0, 1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      expect(allKeys).toEqual(expectedSequence);
    });

    it("should have correct quantization format strings", () => {
      // This test verifies all quantization strings follow expected format
      Object.values(fileTypeMap).forEach((value) => {
        expect(value).toMatch(/^(F32|F16|Q[0-9](?:_[A-Z0-9]+)*)$/);
      });
    });
  });
});
