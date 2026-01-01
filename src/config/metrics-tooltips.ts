import { TooltipContent } from "./tooltip-config.types";

export const memoryTooltips: Record<string, TooltipContent> = {
  cache_ram: {
    title: "Cache RAM",
    description: "Amount of RAM to allocate for KV cache in GB. 0 uses automatic sizing.",
    recommendedValue: "0 or positive GB (default: 0)",
    effectOnModel: "Controls how much model context is kept in fast RAM.",
    whenToAdjust: "Set manually if automatic sizing isn't optimal for your system.",
  },
  cache_type_k: {
    title: "Cache Type K",
    description: "Type of cache for K (key) matrices.",
    recommendedValue: "e.g., f16, q8_0, q4_0",
    effectOnModel: "Determines precision and memory usage for key cache.",
    whenToAdjust: "Choose based on memory constraints and quality requirements.",
  },
  cache_type_v: {
    title: "Cache Type V",
    description: "Type of cache for V (value) matrices.",
    recommendedValue: "e.g., f16, q8_0, q4_0",
    effectOnModel: "Determines precision and memory usage for value cache.",
    whenToAdjust: "Choose based on memory constraints and quality requirements.",
  },
  mmap: {
    title: "Memory Map",
    description: "Whether to use memory-mapped files for model weights. 0=off, 1=on.",
    recommendedValue: "0 or 1 (default: 1)",
    effectOnModel: "MMap reduces RAM usage but may be slower. Disabling loads model entirely into RAM.",
    whenToAdjust: "Disable for maximum speed if you have enough RAM. Enable to save memory.",
  },
  mlock: {
    title: "Memory Lock",
    description: "Whether to lock model in physical RAM to prevent swapping. 0=off, 1=on.",
    recommendedValue: "0 or 1 (default: 0)",
    effectOnModel: "Prevents model from being swapped to disk, improving performance.",
    whenToAdjust: "Enable if system is swapping model to disk and degrading performance.",
  },
  numa: {
    title: "NUMA",
    description: "NUMA policy for multi-socket systems.",
    recommendedValue: "e.g., interleave, preferred",
    effectOnModel: "Optimizes memory access on NUMA architectures.",
    whenToAdjust: "Configure for multi-socket systems for optimal performance.",
  },
  defrag_thold: {
    title: "Defrag Threshold",
    description: "Cache defragmentation threshold. -1 disables defrag.",
    recommendedValue: "-1 or 0-1.0 (default: -1)",
    effectOnModel: "When cache fragmentation exceeds threshold, defrag runs.",
    whenToAdjust: "Enable if experiencing performance degradation due to fragmentation.",
  },
};
