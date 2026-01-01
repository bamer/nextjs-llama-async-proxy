import type { ConfigType } from "./types";

export const memorySectionGroups = [
  {
    title: "Cache Settings",
    icon: "💾",
    fields: ["cache_ram", "cache_type_k", "cache_type_v"],
  },
  {
    title: "Memory Management",
    icon: "🔧",
    fields: ["mmap", "mlock", "numa", "defrag_thold"],
  },
];

export const gpuSectionGroups = [
  {
    title: "Device Selection",
    icon: "🎮",
    fields: ["device", "list_devices"],
  },
  {
    title: "GPU Configuration",
    icon: "⚙️",
    fields: ["gpu_layers", "split_mode", "tensor_split", "main_gpu", "kv_offload"],
  },
  {
    title: "Performance Options",
    icon: "⚡",
    fields: ["repack", "no_host"],
  },
];
