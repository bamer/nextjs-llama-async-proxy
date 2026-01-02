"use client";

import React from "react";
import type { SvgIconTypeMap } from "@mui/material";
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Settings as SettingsIcon,
  Tune as TuneIcon,
  Layers as LayersIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import type { ConfigType, SectionGroup } from "../../components/ui/ModelConfigDialog/types";

// Create icon elements factory
type IconComponentType = React.ComponentType<SvgIconTypeMap["props"]>;

const createIcon = (IconComponent: IconComponentType): React.ReactElement =>
  React.createElement(IconComponent);

// Advanced configuration sections
export const advancedSectionGroups: Partial<Record<ConfigType, SectionGroup[]>> = {
  sampling: [
    {
      title: "Échantillonnage Principal",
      icon: createIcon(SpeedIcon),
      fields: ["temperature", "top_k", "top_p", "min_p", "typical_p"],
    },
    {
      title: "Contrôle de Répétition",
      icon: createIcon(TuneIcon),
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
      title: "Échantillonnage Avancé",
      icon: createIcon(SettingsIcon),
      fields: [
        "mirostat",
        "mirostat_eta",
        "mirostat_tau",
        "dynatemp_range",
        "dynatemp_exponent",
        "top_nsigma",
        "xtc_probability",
        "xtc_threshold",
      ],
    },
    {
      title: "Contraintes de Sortie",
      icon: createIcon(LayersIcon),
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
      title: "Extension de Contexte (ROPE)",
      icon: createIcon(MemoryIcon),
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
      icon: createIcon(SpeedIcon),
      fields: ["flash_attn", "logit_bias"],
    },
  ],
  advanced: [
    {
      title: "Comportement du Modèle",
      icon: createIcon(SettingsIcon),
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
      title: "Calcul Distribué",
      icon: createIcon(MemoryIcon),
      fields: ["rpc", "offline", "override_kv", "op_offload"],
    },
    {
      title: "Ajustement du Modèle",
      icon: createIcon(TuneIcon),
      fields: ["fit", "fit_target", "fit_ctx", "check_tensors"],
    },
    {
      title: "Gestion des Ressources",
      icon: createIcon(SpeedIcon),
      fields: ["sleep_idle_seconds", "polling", "polling_batch"],
    },
    {
      title: "Raisonnement",
      icon: createIcon(LayersIcon),
      fields: ["reasoning_format_value_format", "reasoning_budget", "custom_params"],
    },
  ],
  lora: [
    {
      title: "Adaptateurs LoRA",
      icon: createIcon(LayersIcon),
      fields: ["lora", "lora_scaled"],
    },
    {
      title: "Vecteurs de Contrôle",
      icon: createIcon(TuneIcon),
      fields: [
        "control_vector",
        "control_vector_scaled",
        "control_vector_layer_range",
      ],
    },
    {
      title: "Décodage Spéculatif",
      icon: createIcon(SpeedIcon),
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
      title: "Cache du Modèle de Brouillon",
      icon: createIcon(MemoryIcon),
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
      title: "Options de Décodage Spéculatif",
      icon: createIcon(SettingsIcon),
      fields: ["spec_replace"],
    },
  ],
  multimodal: [
    {
      title: "Projection Visuelle",
      icon: createIcon(ImageIcon),
      fields: ["mmproj", "mmproj_url", "mmproj_auto", "mmproj_offload"],
    },
    {
      title: "Traitement d'Images",
      icon: createIcon(SettingsIcon),
      fields: ["image_min_tokens", "image_max_tokens"],
    },
  ],
};
