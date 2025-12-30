import type { ConfigType } from "@/components/ui/ModelConfigDialog";

export interface ParamDescription {
  description: string;
  recommended: string;
  effect: string;
  whenToAdjust: string;
}

export const PARAM_DESCRIPTIONS: Record<ConfigType, Record<string, ParamDescription>> = {
  sampling: {
    temperature: {
      description: "Controls randomness in token selection. Higher = more creative, Lower = more focused.",
      recommended: "0.0-2.0 (default: 0.7)",
      effect: "Higher values increase creativity but may reduce coherence. Lower values produce more predictable outputs.",
      whenToAdjust: "Increase for creative writing. Decrease for code generation or factual responses.",
    },
    top_k: {
      description: "Limits sampling to K most likely tokens.",
      recommended: "1-100 (default: 40)",
      effect: "Lower values restrict output diversity. Higher values allow more varied vocabulary.",
      whenToAdjust: "Lower for deterministic outputs. Higher to reduce repetition or add variety.",
    },
    top_p: {
      description: "Nucleus sampling: samples from smallest set of tokens whose cumulative probability exceeds P.",
      recommended: "0.1-1.0 (default: 0.9)",
      effect: "Lower values create focused outputs. Higher values allow more creative responses.",
      whenToAdjust: "Decrease for focused outputs. Increase for creative tasks requiring variety.",
    },
    min_p: {
      description: "Minimum probability threshold for token selection.",
      recommended: "0.0-0.5 (default: 0.05)",
      effect: "Filters out very low probability tokens, reducing nonsensical content.",
      whenToAdjust: "Increase to filter more low-probability tokens and improve quality.",
    },
    repeat_last_n: {
      description: "Number of last tokens to consider for repeat penalties.",
      recommended: "0-2048 (default: 64)",
      effect: "Controls sliding window for detecting repeated patterns. Larger windows catch more distant repetitions.",
      whenToAdjust: "Increase for long-range repetition control. Decrease for short-term control.",
    },
    repeat_penalty: {
      description: "Penalty for repeating tokens.",
      recommended: "1.0-2.0 (default: 1.0)",
      effect: "Values >1.0 reduce loops. 1.0 disables penalty. Too high breaks flow.",
      whenToAdjust: "Increase when model repeats. Decrease if output becomes unnatural.",
    },
    presence_penalty: {
      description: "Penalizes tokens already in generated text, encouraging variety.",
      recommended: "0.0-2.0 (default: 0)",
      effect: "Encourages new topics and vocabulary. Too high makes responses incoherent.",
      whenToAdjust: "Use to encourage diverse vocabulary and avoid stuck topics.",
    },
    frequency_penalty: {
      description: "Penalizes tokens based on frequency of appearance.",
      recommended: "0.0-2.0 (default: 0)",
      effect: "More aggressive than presence penalty, heavily penalizing frequent words.",
      whenToAdjust: "When presence penalty isn't enough to reduce word repetition.",
    },
    mirostat: {
      description: "Mirostat algorithm: 0=off, 1=Mirostat, 2=Mirostat 2.0.",
      recommended: "0, 1, or 2 (default: 0)",
      effect: "Maintains constant perplexity for consistent text quality.",
      whenToAdjust: "Use for consistently high-quality output with controlled perplexity.",
    },
    seed: {
      description: "Random seed for generation. -1 uses random.",
      recommended: "-1 or positive integer (default: -1)",
      effect: "Same seed with same settings produces identical output.",
      whenToAdjust: "Set for reproducible outputs during testing or debugging.",
    },
  },
  memory: {
    cache_ram: {
      description: "RAM to allocate for KV cache in GB. 0 uses automatic sizing.",
      recommended: "0 or positive GB (default: 0)",
      effect: "Controls how much model context is kept in fast RAM.",
      whenToAdjust: "Set manually if automatic sizing isn't optimal for your system.",
    },
    mmap: {
      description: "Use memory-mapped files for model weights. 0=off, 1=on.",
      recommended: "0 or 1 (default: 1)",
      effect: "MMap reduces RAM but may be slower. Disabling loads all to RAM.",
      whenToAdjust: "Disable for speed with enough RAM. Enable to save memory.",
    },
    mlock: {
      description: "Lock model in RAM to prevent swapping. 0=off, 1=on.",
      recommended: "0 or 1 (default: 0)",
      effect: "Prevents swapping to disk, improving performance.",
      whenToAdjust: "Enable if system swaps model to disk degrading performance.",
    },
  },
  gpu: {
    gpu_layers: {
      description: "Number of layers to offload to GPU. -1 offloads all possible.",
      recommended: "-1 or 0-n (default: -1)",
      effect: "More layers = faster inference but more VRAM used.",
      whenToAdjust: "Decrease if out of VRAM. Increase for maximum speed.",
    },
    main_gpu: {
      description: "Primary GPU for main model operations.",
      recommended: "GPU index (default: 0)",
      effect: "Specifies which GPU handles main computation.",
      whenToAdjust: "Set to fastest GPU in heterogeneous multi-GPU setups.",
    },
    kv_offload: {
      description: "Offload KV cache to GPU. 0=off, 1=on.",
      recommended: "0 or 1 (default: 0)",
      effect: "Improves speed but uses VRAM.",
      whenToAdjust: "Enable if you have spare VRAM for faster inference.",
    },
  },
  advanced: {
    context_shift: {
      description: "Enable context window shifting. 0=off, 1=on.",
      recommended: "0 or 1 (default: 0)",
      effect: "Allows handling sequences longer than model's context window.",
      whenToAdjust: "Enable when working with very long inputs.",
    },
    flash_attn: {
      description: "Use flash attention for faster inference. 0=off, 1=on.",
      recommended: "0 or 1 (default: empty)",
      effect: "Significantly speeds up attention computation when supported.",
      whenToAdjust: "Enable if GPU supports Flash Attention for faster generation.",
    },
    check_tensors: {
      description: "Validate tensors. 0=off, 1=on.",
      recommended: "0 or 1 (default: 0)",
      effect: "Performs tensor validation checks.",
      whenToAdjust: "Enable for debugging model loading issues.",
    },
    sleep_idle_seconds: {
      description: "Seconds to sleep when idle. 0=disabled.",
      recommended: "0-3600 (default: 0)",
      effect: "Controls idle timeout for resource management.",
      whenToAdjust: "Set to free resources after inactivity.",
    },
  },
  lora: {
    lora: {
      description: "Path to LoRA adapter file.",
      recommended: "File path to .gguf LoRA file",
      effect: "Applies LoRA adapter to modify model behavior and specialize it.",
      whenToAdjust: "Use to fine-tune model for specific tasks or styles.",
    },
    draft_max: {
      description: "Maximum tokens to draft in speculative decoding.",
      recommended: "1-64 (default: 16)",
      effect: "Limits speculative decoding draft length.",
      whenToAdjust: "Adjust based on acceptance rate and performance.",
    },
    draft_min: {
      description: "Minimum tokens to draft in speculative decoding.",
      recommended: "1-32 (default: 5)",
      effect: "Ensures minimum draft length for speculative decoding.",
      whenToAdjust: "Set based on acceptance characteristics.",
    },
  },
  multimodal: {
    mmproj: {
      description: "Path to multimodal projection model (CLIP encoder).",
      recommended: "File path to mmproj .gguf file",
      effect: "Enables vision capabilities by loading projection model.",
      whenToAdjust: "Load when using vision features.",
    },
    image_max_tokens: {
      description: "Maximum tokens per image encoding.",
      recommended: "0-8192 (default: 0)",
      effect: "Limits maximum encoding length for images.",
      whenToAdjust: "Increase for more detailed image understanding.",
    },
    mmproj_auto: {
      description: "Auto-detect multimodal model. 0=off, 1=on.",
      recommended: "0 or 1 (default: 0)",
      effect: "Automatically finds projection model.",
      whenToAdjust: "Enable for easier multimodal setup.",
    },
  },
};

export function getParamDescription(configType: ConfigType, fieldName: string): ParamDescription | undefined {
  return PARAM_DESCRIPTIONS[configType]?.[fieldName];
}
