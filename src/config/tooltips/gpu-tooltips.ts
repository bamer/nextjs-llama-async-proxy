import { TooltipContent } from "./tooltip-config.types";

/**
 * GPU-related configuration tooltips
 */
export const gpuTooltips: Record<string, TooltipContent> = {
  device: {
    title: "Device",
    description: "Device to use for computation.",
    recommendedValue: "e.g., cuda, metal, cpu",
    effectOnModel: "Selects compute backend. CUDA for NVIDIA, Metal for Apple Silicon.",
    whenToAdjust: "Set based on your hardware. Auto-detection usually works.",
  },
  list_devices: {
    title: "List Devices",
    description: "Whether to list available devices. 0=off, 1=on.",
    recommendedValue: "0 or 1 (default: 0)",
    effectOnModel: "When enabled, logs available devices.",
    whenToAdjust: "Use for debugging device selection.",
  },
  gpu_layers: {
    title: "GPU Layers",
    description: "Number of model layers to offload to GPU. -1 offloads all possible layers.",
    recommendedValue: "-1 or 0-n (default: -1)",
    effectOnModel: "More layers = faster inference but more VRAM used.",
    whenToAdjust: "Decrease if you run out of VRAM. Increase for maximum speed.",
  },
  split_mode: {
    title: "Split Mode",
    description: "How to split model across multiple GPUs.",
    recommendedValue: "empty, layer, or row",
    effectOnModel: "Layer splits by layers, row splits tensors within layers.",
    whenToAdjust: "Configure for multi-GPU setups to optimize VRAM usage.",
  },
  tensor_split: {
    title: "Tensor Split",
    description: "Comma-separated list of VRAM allocations for each GPU.",
    recommendedValue: "e.g., 8,8,8 for 8GB each on 3 GPUs",
    effectOnModel: "Controls VRAM allocation per GPU in multi-GPU setups.",
    whenToAdjust: "Set based on each GPU's VRAM capacity.",
  },
  main_gpu: {
    title: "Main GPU",
    description: "Primary GPU for main model operations.",
    recommendedValue: "GPU index (default: 0)",
    effectOnModel: "Specifies which GPU handles the main computation.",
    whenToAdjust: "Set to fastest GPU in heterogeneous multi-GPU setups.",
  },
  kv_offload: {
    title: "KV Offload",
    description: "Whether to offload KV cache to GPU. 0=off, 1=on.",
    recommendedValue: "0 or 1 (default: 0)",
    effectOnModel: "Offloading KV cache to GPU improves speed but uses VRAM.",
    whenToAdjust: "Enable if you have spare VRAM for faster inference.",
  },
  repack: {
    title: "Repack",
    description: "Whether to repack tensors for better GPU utilization. 0=off, 1=on.",
    recommendedValue: "0 or 1 (default: 0)",
    effectOnModel: "Repacking can improve performance but adds startup time.",
    whenToAdjust: "Enable if startup time isn't critical and you want max performance.",
  },
  no_host: {
    title: "No Host",
    description: "Whether to disable host memory usage. 0=off, 1=on.",
    recommendedValue: "0 or 1 (default: 0)",
    effectOnModel: "When enabled, forces all computation on device.",
    whenToAdjust: "Use only if device has enough memory for entire model.",
  },
};
