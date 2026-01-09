/**
 * Parameter Definitions for llama.cpp
 * Organized by category with validation rules and metadata
 */

const PARAMETER_CATEGORIES = {
  modelSettings: {
    name: "Model Settings",
    description: "Core model loading and configuration options",
    parameters: {
      model: {
        label: "Model Path",
        type: "text",
        description: "Path to the model GGUF file",
        placeholder: "/path/to/model.gguf",
        cliFlag: "--model",
        required: true,
        validation: {
          type: "string",
          required: true,
          minLength: 1,
        },
      },
      "ctx-size": {
        label: "Context Size",
        type: "number",
        description: "Context window size for the model",
        default: 2048,
        min: 1,
        max: 131072,
        step: 1,
        cliFlag: "-c, --ctx-size",
        unit: "tokens",
        validation: {
          type: "number",
          min: 1,
          max: 131072,
        },
      },
      "ctx-checkpoints": {
        label: "Context Checkpoints",
        type: "number",
        description: "Number of KV cache checkpoints to save",
        default: 0,
        min: 0,
        step: 1,
        cliFlag: "--ctx-checkpoints",
        validation: {
          type: "number",
          min: 0,
        },
      },
      "n-gpu-layers": {
        label: "GPU Layers",
        type: "number",
        description: "Number of layers to offload to GPU",
        default: 0,
        min: 0,
        max: 1000,
        step: 1,
        cliFlag: "-ngl, --n-gpu-layers",
        validation: {
          type: "number",
          min: 0,
          max: 1000,
        },
      },
      "split-mode": {
        label: "Split Mode",
        type: "select",
        description: "How to split tensors across GPUs",
        options: [
          { value: "none", label: "None (single GPU)" },
          { value: "layer", label: "Layer (split by layers)" },
          { value: "row", label: "Row (split by rows)" },
        ],
        default: "layer",
        cliFlag: "--split-mode",
        validation: {
          type: "enum",
          values: ["none", "layer", "row"],
        },
      },
      "tensor-split": {
        label: "Tensor Split",
        type: "text",
        description: "Ratio for splitting tensors across GPUs (e.g., 1,1 or 0.5,0.5)",
        placeholder: "0.5,0.5,0.5,0.5",
        cliFlag: "--tensor-split",
        validation: {
          type: "tensorSplit",
        },
      },
      "main-gpu": {
        label: "Main GPU",
        type: "number",
        description: "Main GPU for sequential processing",
        default: 0,
        min: 0,
        step: 1,
        cliFlag: "--main-gpu",
        validation: {
          type: "number",
          min: 0,
        },
      },
      "load-on-startup": {
        label: "Load on Startup",
        type: "boolean",
        description: "Load model when server starts",
        default: false,
        cliFlag: "--load-on-startup",
        validation: {
          type: "boolean",
        },
      },
    },
  },
  performance: {
    name: "Performance",
    description: "Thread and memory settings for optimal performance",
    parameters: {
      threads: {
        label: "Threads",
        type: "number",
        description: "Number of threads to use (0 = auto-detect)",
        default: 0,
        min: 0,
        max: 128,
        step: 1,
        cliFlag: "-t, --threads",
        validation: {
          type: "number",
          min: 0,
          max: 128,
        },
      },
      batch: {
        label: "Batch Size",
        type: "number",
        description: "Maximum batch size for prompt processing",
        default: 512,
        min: 1,
        max: 8192,
        step: 1,
        cliFlag: "-b, --batch",
        validation: {
          type: "number",
          min: 1,
          max: 8192,
        },
      },
      ubatch: {
        label: "Micro Batch Size",
        type: "number",
        description: "Micro batch size for continuous batching",
        default: 512,
        min: 1,
        max: 8192,
        step: 1,
        cliFlag: "--ubatch",
        validation: {
          type: "number",
          min: 1,
          max: 8192,
        },
      },
      "cache-ram": {
        label: "KV Cache RAM",
        type: "number",
        description: "Maximum KV cache RAM to use (0 = unlimited)",
        default: 0,
        min: 0,
        step: 1,
        cliFlag: "--cache-ram",
        unit: "MB",
        validation: {
          type: "number",
          min: 0,
        },
      },
      "threads-http": {
        label: "HTTP Threads",
        type: "number",
        description: "Number of threads for HTTP server",
        default: 1,
        min: 1,
        max: 32,
        step: 1,
        cliFlag: "--threads-http",
        validation: {
          type: "number",
          min: 1,
          max: 32,
        },
      },
    },
  },
  sampling: {
    name: "Sampling",
    description: "Text generation and sampling parameters",
    parameters: {
      temp: {
        label: "Temperature",
        type: "number",
        description: "Controls randomness in generation (0 = deterministic)",
        default: 0.7,
        min: 0,
        max: 2.0,
        step: 0.01,
        cliFlag: "--temp",
        validation: {
          type: "number",
          min: 0,
          max: 2.0,
        },
      },
      seed: {
        label: "Random Seed",
        type: "number",
        description: "Random seed for reproducibility (-1 = random)",
        default: -1,
        min: -1,
        max: 2147483647,
        step: 1,
        cliFlag: "-s, --seed",
        validation: {
          type: "number",
          min: -1,
          max: 2147483647,
        },
      },
      "top-p": {
        label: "Top-P",
        type: "number",
        description: " nucleus sampling threshold (0-1)",
        default: 0.95,
        min: 0,
        max: 1,
        step: 0.01,
        cliFlag: "-topp, --top-p",
        validation: {
          type: "number",
          min: 0,
          max: 1,
        },
      },
      "top-k": {
        label: "Top-K",
        type: "number",
        description: "Limit token selection to top K most likely",
        default: 40,
        min: 1,
        max: 1000,
        step: 1,
        cliFlag: "-topk, --top-k",
        validation: {
          type: "number",
          min: 1,
          max: 1000,
        },
      },
      "min-p": {
        label: "Min-P",
        type: "number",
        description: "Minimum probability threshold for token selection",
        default: 0.05,
        min: 0,
        max: 1,
        step: 0.01,
        cliFlag: "--min-p",
        validation: {
          type: "number",
          min: 0,
          max: 1,
        },
      },
      mirostat: {
        label: "Mirostat Mode",
        type: "select",
        description: "Mirostat sampling mode (0=disabled, 1=Mirostat, 2=Mirostat 2.0)",
        options: [
          { value: "0", label: "Disabled" },
          { value: "1", label: "Mirostat 1.0" },
          { value: "2", label: "Mirostat 2.0" },
        ],
        default: 0,
        cliFlag: "--mirostat",
        validation: {
          type: "enum",
          values: [0, 1, 2],
        },
      },
      "mirostat-lr": {
        label: "Mirostat Learning Rate",
        type: "number",
        description: "Learning rate for Mirostat target entropy adjustment",
        default: 0.1,
        min: 0.001,
        max: 1.0,
        step: 0.001,
        cliFlag: "--mirostat-lr",
        validation: {
          type: "number",
          min: 0.001,
          max: 1.0,
        },
      },
      "mirostat-ent": {
        label: "Mirostat Entropy",
        type: "number",
        description: "Target entropy for Mirostat sampling",
        default: 5.0,
        min: 1.0,
        max: 20.0,
        step: 0.1,
        cliFlag: "--mirostat-ent",
        validation: {
          type: "number",
          min: 1.0,
          max: 20.0,
        },
      },
      samplers: {
        label: "Samplers",
        type: "multiselect",
        description: "Order of samplers to apply",
        options: [
          { value: "mirostat", label: "Mirostat" },
          { value: "mirostat2", label: "Mirostat 2.0" },
          { value: "greedy", label: "Greedy" },
          { value: "dist", label: "Dist" },
          { value: "typical", label: "Typical" },
          { value: "topk", label: "TopK" },
          { value: "nucleus", label: "Nucleus (Top-P)" },
          { value: "epsilon", label: "Epsilon" },
          { value: "ypsilon", label: "Ypsilon" },
          { value: "tailfree", label: "Tail Free" },
          { value: "locallytypical", label: "Locally Typical" },
          { value: "grammar", label: "Grammar" },
          { value: "json", label: "JSON" },
        ],
        default: ["typical", "topk", "nucleus"],
        cliFlag: "--samplers",
        validation: {
          type: "array",
          itemType: "string",
        },
      },
    },
  },
  speculativeDecoding: {
    name: "Speculative Decoding",
    description: "Draft model settings for speculative decoding",
    parameters: {
      "draft-min": {
        label: "Min Draft Tokens",
        type: "number",
        description: "Minimum number of draft tokens to use",
        default: 4,
        min: 1,
        max: 100,
        step: 1,
        cliFlag: "--draft-min",
        validation: {
          type: "number",
          min: 1,
          max: 100,
        },
      },
      "draft-max": {
        label: "Max Draft Tokens",
        type: "number",
        description: "Maximum number of draft tokens to use",
        default: 16,
        min: 1,
        max: 100,
        step: 1,
        cliFlag: "--draft-max",
        validation: {
          type: "number",
          min: 1,
          max: 100,
        },
      },
      "draft-p-min": {
        label: "Min Draft Probability",
        type: "number",
        description: "Minimum probability for draft tokens",
        default: 0.0,
        min: 0,
        max: 1,
        step: 0.01,
        cliFlag: "--draft-p-min",
        validation: {
          type: "number",
          min: 0,
          max: 1,
        },
      },
    },
  },
  advanced: {
    name: "Advanced",
    description: "Advanced configuration options",
    parameters: {
      mmap: {
        label: "Memory Map",
        type: "boolean",
        description: "Use memory-mapped files for faster loading",
        default: true,
        cliFlag: "--no-mmap",
        invertBoolean: true,
        validation: {
          type: "boolean",
        },
      },
      mmp: {
        label: "Memory Pool",
        type: "boolean",
        description: "Use memory pooling for KV cache",
        default: true,
        cliFlag: "--no-mmap",
        invertBoolean: true,
        validation: {
          type: "boolean",
        },
      },
      "presence-penalty": {
        label: "Presence Penalty",
        type: "number",
        description: "Penalty for token presence (negative = encourages repetition)",
        default: 0.0,
        min: -2.0,
        max: 2.0,
        step: 0.01,
        cliFlag: "--presence-penalty",
        validation: {
          type: "number",
          min: -2.0,
          max: 2.0,
        },
      },
      "frequency-penalty": {
        label: "Frequency Penalty",
        type: "number",
        description: "Penalty for token frequency (negative = encourages repetition)",
        default: 0.0,
        min: -2.0,
        max: 2.0,
        step: 0.01,
        cliFlag: "--frequency-penalty",
        validation: {
          type: "number",
          min: -2.0,
          max: 2.0,
        },
      },
      "repeat-penalty": {
        label: "Repeat Penalty",
        type: "number",
        description: "Penalty for token repetition",
        default: 1.0,
        min: 1.0,
        max: 2.0,
        step: 0.01,
        cliFlag: "--repeat-penalty",
        validation: {
          type: "number",
          min: 1.0,
          max: 2.0,
        },
      },
    },
  },
};

/**
 * Flatten all parameters into a single object
 */
function getAllParameters() {
  const all = {};
  Object.entries(PARAMETER_CATEGORIES).forEach(([categoryId, category]) => {
    Object.entries(category.parameters).forEach(([paramId, param]) => {
      all[paramId] = {
        ...param,
        category: categoryId,
        categoryName: category.name,
      };
    });
  });
  return all;
}

/**
 * Get parameters for specific categories
 */
function getParametersForCategories(categoryIds) {
  const all = getAllParameters();
  const filtered = {};
  categoryIds.forEach((catId) => {
    Object.entries(all).forEach(([paramId, param]) => {
      if (param.category === catId) {
        filtered[paramId] = param;
      }
    });
  });
  return filtered;
}

/**
 * Get category info by ID
 */
function getCategoryInfo(categoryId) {
  return PARAMETER_CATEGORIES[categoryId] || null;
}

/**
 * Get all category IDs
 */
function getCategoryIds() {
  return Object.keys(PARAMETER_CATEGORIES);
}

/**
 * Get default value for a parameter
 */
function getDefaultValue(paramId) {
  const all = getAllParameters();
  const param = all[paramId];
  if (!param) return null;
  return param.default;
}

/**
 * Build CLI args from config object
 */
function buildCliArgs(config) {
  const all = getAllParameters();
  const args = [];

  Object.entries(config).forEach(([paramId, value]) => {
    const param = all[paramId];
    if (!param || value === undefined || value === null) return;

    const cliFlag = param.cliFlag;
    if (!cliFlag) return;

    // Handle boolean flags with inversion
    if (param.type === "boolean") {
      if (param.invertBoolean) {
        if (!value) {
          args.push("--no-mmap");
        }
      } else {
        if (value) {
          args.push(cliFlag.split(",")[0].trim());
        }
      }
      return;
    }

    // Handle array types (like tensor-split, samplers)
    if (Array.isArray(value)) {
      const separator = param.type === "multiselect" ? " " : ",";
      args.push(`${cliFlag.split(",")[0].trim()} ${value.join(separator)}`);
      return;
    }

    // Handle regular values
    args.push(`${cliFlag.split(",")[0].trim()} ${value}`);
  });

  return args;
}

// Export for use in other modules
window.ParameterCategories = PARAMETER_CATEGORIES;
window.getAllParameters = getAllParameters;
window.getParametersForCategories = getParametersForCategories;
window.getCategoryInfo = getCategoryInfo;
window.getCategoryIds = getCategoryIds;
window.getDefaultValue = getDefaultValue;
window.buildCliArgs = buildCliArgs;
