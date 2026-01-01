import type { ConfigType } from "./types";

export const samplingSectionGroups = [
  {
    title: "Core Sampling",
    icon: "🎯",
    fields: ["temperature", "top_k", "top_p", "min_p", "typical_p"],
  },
  {
    title: "Repetition Control",
    icon: "🔄",
    fields: [
      "repeat_last_n",
      "repeat_penalty",
      "presence_penalty",
      "frequency_penalty",
      "dry_multiplier",
      "dry_base",
      "dry_allowed_length",
      "dry_penalty_last_n",
      "dry_sequence_breaker",
    ],
  },
  {
    title: "Advanced Sampling",
    icon: "⚙️",
    fields: [
      "mirostat",
      "mirostat_lr",
      "mirostat_ent",
      "dynatemp_range",
      "dynatemp_exp",
      "top_nsigma",
      "xtc_probability",
      "xtc_threshold",
    ],
  },
  {
    title: "Output Constraints",
    icon: "📝",
    fields: [
      "samplers",
      "sampler_seq",
      "seed",
      "grammar",
      "grammar_file",
      "json_schema",
      "json_schema_file",
      "ignore_eos",
      "escape",
    ],
  },
  {
    title: "Context Extension (ROPE)",
    icon: "📏",
    fields: [
      "rope_scaling_type",
      "rope_scale",
      "rope_freq_base",
      "rope_freq_scale",
      "yarn_orig_ctx",
      "yarn_ext_factor",
      "yarn_attn_factor",
      "yarn_beta_slow",
      "yarn_beta_fast",
    ],
  },
  {
    title: "Performance",
    icon: "⚡",
    fields: ["flash_attn", "logit_bias"],
  },
];
