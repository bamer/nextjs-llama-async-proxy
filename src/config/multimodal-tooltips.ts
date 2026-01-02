import { TooltipContent } from "./tooltip-config.types";

export const multimodalTooltips: Record<string, TooltipContent> = {
  mmproj: {
    title: "MMPROJ",
    description: "Path to multimodal projection model (CLIP encoder).",
    recommendedValue: "File path to mmproj .gguf file",
    effectOnModel: "Enables vision capabilities by loading projection model.",
    whenToAdjust: "Load when using vision features.",
  },
  mmproj_url: {
    title: "MMPROJ URL",
    description: "URL to download multimodal projection model.",
    recommendedValue: "URL to mmproj model",
    effectOnModel: "Downloads projection model for vision support.",
    whenToAdjust: "Use when projection model needs to be downloaded.",
  },
  mmproj_auto: {
    title: "MMPROJ Auto",
    description: "Whether to auto-detect multimodal model. 0=off, 1=on.",
    recommendedValue: "0 or 1 (default: 0)",
    effectOnModel: "Automatically finds projection model.",
    whenToAdjust: "Enable for easier multimodal setup.",
  },
  mmproj_offload: {
    title: "MMPROJ Offload",
    description: "Whether to offload projection model to GPU. 0=off, 1=on.",
    recommendedValue: "0 or 1 (default: 0)",
    effectOnModel: "Offloads vision encoder to GPU for faster processing.",
    whenToAdjust: "Enable if GPU has sufficient VRAM for faster vision processing.",
  },
  image_min_tokens: {
    title: "Image Min Tokens",
    description: "Minimum number of tokens per image.",
    recommendedValue: "0 - 8192 (default: 0)",
    effectOnModel: "Controls minimum encoding length for images.",
    whenToAdjust: "Adjust based on image detail requirements.",
  },
  image_max_tokens: {
    title: "Image Max Tokens",
    description: "Maximum number of tokens per image.",
    recommendedValue: "0 - 8192 (default: 0)",
    effectOnModel: "Limits maximum encoding length for images.",
    whenToAdjust: "Increase for more detailed image understanding.",
  },
};