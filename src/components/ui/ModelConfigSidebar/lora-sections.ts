import type { ConfigType } from "./types";

export const loraSectionGroups = [
  {
    title: "LoRA Adapters",
    icon: "🔌",
    fields: ["lora", "lora_scaled"],
  },
  {
    title: "Control Vectors",
    icon: "🎛",
    fields: [
      "control_vector",
      "control_vector_scaled",
      "control_vector_layer_range",
    ],
  },
  {
    title: "Speculative Decoding",
    icon: "⚡",
    fields: [
      "model_draft",
      "model_url_draft",
      "ctx_size_draft",
      "threads_draft",
      "threads_batch_draft",
      "draft_max",
      "draft_min",
      "draft_p_min",
    ],
  },
  {
    title: "Draft Model Cache",
    icon: "💾",
    fields: [
      "cache_type_k_draft",
      "cache_type_v_draft",
      "cpu_moe_draft",
      "n_cpu_moe_draft",
      "n_gpu_layers_draft",
      "device_draft",
    ],
  },
  {
    title: "Speculative Decoding Options",
    icon: "⚙️",
    fields: ["spec_replace"],
  },
];
