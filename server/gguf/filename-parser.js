/**
 * Extract architecture from filename using regex patterns
 * @param {string} filename - The model filename
 * @returns {string} Architecture name
 */
export function extractArchitecture(filename) {
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

/**
 * Extract parameter size from filename
 * @param {string} filename - The model filename
 * @returns {string} Parameter size (e.g., "7B", "13B")
 */
export function extractParams(filename) {
  const match = filename.match(/(\d+(?:\.\d+)?)[bB](?=[-._\s]|$)/);
  if (match) return `${match[1]}B`;
  const lower = filename.toLowerCase();
  if (/phi[-_]?3/i.test(lower)) return "3B";
  if (/yi[-_]?34b/i.test(lower)) return "34B";
  if (/dbrx/i.test(lower)) return "132B";
  if (/nemotron[-_]?8b/i.test(lower)) return "8B";
  if (/nemotron[-_]?5b/i.test(lower)) return "5B";
  if (/mixtral[-_]?8x/i.test(lower)) return "12B";
  return "";
}

/**
 * Extract quantization from filename
 * @param {string} filename - The model filename
 * @returns {string} Quantization label (e.g., "Q4_K_M", "Q8_0")
 */
export function extractQuantization(filename) {
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
