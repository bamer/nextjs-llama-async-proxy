import type { ConfigType } from "./types";

export const advancedSectionGroups = [
  {
    title: "Model Behavior",
    icon: "🤖",
    fields: [
      "swa_full",
      "override_tensor",
      "cpu_moe",
      "n_cpu_moe",
      "kv_unified",
      "pooling",
      "context_shift",
    ],
  },
  {
    title: "Distributed Computing",
    icon: "🌐",
    fields: ["rpc", "offline", "override_kv", "op_offload"],
  },
  {
    title: "Model Fitting",
    icon: "📏",
    fields: ["fit", "fit_target", "fit_ctx", "check_tensors"],
  },
  {
    title: "Resource Management",
    icon: "🔋",
    fields: ["sleep_idle_seconds", "polling", "polling_batch"],
  },
  {
    title: "Reasoning",
    icon: "🧠",
    fields: ["reasoning_format_value_format", "reasoning_budget", "custom_params"],
  },
];
