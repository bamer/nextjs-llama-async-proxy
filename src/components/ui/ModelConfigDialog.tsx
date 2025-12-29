"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  TextField,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Divider,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  DeveloperBoard as GpuIcon,
  Settings as SettingsIcon,
  Tune as TuneIcon,
  Layers as LayersIcon,
  Image as ImageIcon,
  Restore as RestoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { useEffect, useState, useCallback } from "react";
import { getTooltipContent } from "@/config/tooltip-config";
import { FieldWithTooltip } from "./FormTooltip";
import { useTheme } from "@mui/material/styles";

// Config types
export type ConfigType =
  | "sampling"
  | "memory"
  | "gpu"
  | "advanced"
  | "lora"
  | "multimodal";

interface ModelConfigDialogProps {
  open: boolean;
  modelId: number | undefined;
  configType: ConfigType | null;
  config: Record<string, unknown>;
  onClose: () => void;
  onSave: (config: Record<string, unknown>) => void;
}

// Validation rules interface
interface ValidationRule {
  min?: number;
  max?: number;
  required?: boolean;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
}

// Field definition with extended properties
interface FieldDefinition {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "boolean";
  options?: string[];
  defaultValue: unknown;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  validation?: ValidationRule;
  unit?: string;
  step?: number;
  marks?: Array<{ value: number; label: string }>;
}

// Section groups for accordion organization
const sectionGroups: Record<ConfigType, Array<{ title: string; icon: React.ReactNode; fields: string[] }>> = {
  sampling: [
    {
      title: "Core Sampling",
      icon: <SpeedIcon />,
      fields: ["temperature", "top_k", "top_p", "min_p", "typical_p"],
    },
    {
      title: "Repetition Control",
      icon: <TuneIcon />,
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
      icon: <SettingsIcon />,
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
      icon: <LayersIcon />,
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
      icon: <MemoryIcon />,
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
      icon: <SpeedIcon />,
      fields: ["flash_attn", "logit_bias"],
    },
  ],
  memory: [
    {
      title: "Cache Settings",
      icon: <MemoryIcon />,
      fields: ["cache_ram", "cache_type_k", "cache_type_v"],
    },
    {
      title: "Memory Management",
      icon: <SettingsIcon />,
      fields: ["mmap", "mlock", "numa", "defrag_thold"],
    },
  ],
  gpu: [
    {
      title: "Device Selection",
      icon: <GpuIcon />,
      fields: ["device", "list_devices"],
    },
    {
      title: "GPU Configuration",
      icon: <SettingsIcon />,
      fields: ["gpu_layers", "split_mode", "tensor_split", "main_gpu", "kv_offload"],
    },
    {
      title: "Performance Options",
      icon: <SpeedIcon />,
      fields: ["repack", "no_host"],
    },
  ],
  advanced: [
    {
      title: "Model Behavior",
      icon: <SettingsIcon />,
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
      icon: <GpuIcon />,
      fields: ["rpc", "offline", "override_kv", "op_offload"],
    },
    {
      title: "Model Fitting",
      icon: <TuneIcon />,
      fields: ["fit", "fit_target", "fit_ctx", "check_tensors"],
    },
    {
      title: "Resource Management",
      icon: <MemoryIcon />,
      fields: ["sleep_idle_seconds", "polling", "polling_batch"],
    },
    {
      title: "Reasoning",
      icon: <LayersIcon />,
      fields: ["reasoning_format_value_format", "reasoning_budget", "custom_params"],
    },
  ],
  lora: [
    {
      title: "LoRA Adapters",
      icon: <LayersIcon />,
      fields: ["lora", "lora_scaled"],
    },
    {
      title: "Control Vectors",
      icon: <TuneIcon />,
      fields: [
        "control_vector",
        "control_vector_scaled",
        "control_vector_layer_range",
      ],
    },
    {
      title: "Speculative Decoding",
      icon: <SpeedIcon />,
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
      icon: <MemoryIcon />,
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
      icon: <SettingsIcon />,
      fields: ["spec_replace"],
    },
  ],
  multimodal: [
    {
      title: "Vision Projection",
      icon: <ImageIcon />,
      fields: ["mmproj", "mmproj_url", "mmproj_auto", "mmproj_offload"],
    },
    {
      title: "Image Processing",
      icon: <SettingsIcon />,
      fields: ["image_min_tokens", "image_max_tokens"],
    },
  ],
};

// Validation rules for different fields
const validationRules: Record<string, ValidationRule> = {
  temperature: { min: 0, max: 2, required: false },
  top_k: { min: 1, max: 100, required: false },
  top_p: { min: 0, max: 1, required: false },
  min_p: { min: 0, max: 0.5, required: false },
  top_nsigma: { min: 0, max: 3, required: false },
  xtc_probability: { min: 0, max: 1, required: false },
  xtc_threshold: { min: 0, max: 1, required: false },
  typical_p: { min: 0.1, max: 1, required: false },
  repeat_last_n: { min: 0, max: 2048, required: false },
  repeat_penalty: { min: 1, max: 2, required: false },
  presence_penalty: { min: 0, max: 2, required: false },
  frequency_penalty: { min: 0, max: 2, required: false },
  dry_multiplier: { min: 0, max: 5, required: false },
  dry_base: { min: 1, max: 3, required: false },
  dry_allowed_length: { min: 0, max: 10, required: false },
  dry_penalty_last_n: { min: 0, max: 512, required: false },
  dynatemp_range: { min: 0, max: 2, required: false },
  dynatemp_exp: { min: 0.1, max: 2, required: false },
  mirostat: { min: 0, max: 2, required: false },
  mirostat_lr: { min: 0.001, max: 1, required: false },
  mirostat_ent: { min: 0, max: 10, required: false },
  seed: { min: -1, max: Number.MAX_SAFE_INTEGER, required: false },
  rope_scale: { min: 0, max: 10, required: false },
  rope_freq_base: { min: 0, max: 1000000, required: false },
  rope_freq_scale: { min: 0, max: 10, required: false },
  yarn_orig_ctx: { min: 0, max: 32768, required: false },
  yarn_ext_factor: { min: -1, max: 16, required: false },
  yarn_attn_factor: { min: 0, max: 4, required: false },
  yarn_beta_slow: { min: 0, max: 10, required: false },
  yarn_beta_fast: { min: 0, max: 100, required: false },
  cache_ram: { min: 0, max: 128, required: false },
  defrag_thold: { min: -1, max: 1, required: false },
  gpu_layers: { min: -1, max: 1000, required: false },
  main_gpu: { min: 0, max: 16, required: false },
  kv_offload: { min: 0, max: 1, required: false },
  n_cpu_moe: { min: 0, max: 64, required: false },
  n_cpu_moe_draft: { min: 0, max: 32, required: false },
  n_gpu_layers_draft: { min: -1, max: 1000, required: false },
  fit_target: { min: 0, max: 100, required: false },
  fit_ctx: { min: 0, max: 32768, required: false },
  sleep_idle_seconds: { min: 0, max: 3600, required: false },
  reasoning_budget: { min: 0, max: 8192, required: false },
  ctx_size_draft: { min: 512, max: 16384, required: false },
  draft_max: { min: 1, max: 64, required: false },
  draft_min: { min: 1, max: 32, required: false },
  draft_p_min: { min: 0, max: 0.5, required: false },
  image_min_tokens: { min: 0, max: 8192, required: false },
  image_max_tokens: { min: 0, max: 8192, required: false },
};

// Field definitions for each config type
const configFields: Record<ConfigType, FieldDefinition[]> = {
  sampling: [
    { name: "temperature", label: "Temperature", type: "number", defaultValue: 0.7, xs: 12, sm: 6, unit: "", step: 0.01, marks: [{ value: 0, label: "0" }, { value: 1, label: "1" }, { value: 2, label: "2" }] },
    { name: "top_k", label: "Top K", type: "number", defaultValue: 40, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "top_p", label: "Top P", type: "number", defaultValue: 0.9, xs: 12, sm: 6, unit: "", step: 0.01, marks: [{ value: 0, label: "0" }, { value: 1, label: "1" }] },
    { name: "min_p", label: "Min P", type: "number", defaultValue: 0.05, xs: 12, sm: 6, unit: "", step: 0.01 },
    { name: "top_nsigma", label: "Top N Sigma", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "xtc_probability", label: "XTC Probability", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 0.01, marks: [{ value: 0, label: "0" }, { value: 1, label: "1" }] },
    { name: "xtc_threshold", label: "XTC Threshold", type: "number", defaultValue: 0.1, xs: 12, sm: 6, unit: "", step: 0.01 },
    { name: "typical_p", label: "Typical P", type: "number", defaultValue: 1, xs: 12, sm: 6, unit: "", step: 0.01, marks: [{ value: 0, label: "0" }, { value: 1, label: "1" }] },
    { name: "repeat_last_n", label: "Repeat Last N", type: "number", defaultValue: 64, xs: 12, sm: 6, unit: "tokens", step: 1 },
    { name: "repeat_penalty", label: "Repeat Penalty", type: "number", defaultValue: 1, xs: 12, sm: 6, unit: "", step: 0.01, marks: [{ value: 1, label: "1.0" }, { value: 1.5, label: "1.5" }, { value: 2, label: "2.0" }] },
    { name: "presence_penalty", label: "Presence Penalty", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "frequency_penalty", label: "Frequency Penalty", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "dry_multiplier", label: "DRY Multiplier", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "dry_base", label: "DRY Base", type: "number", defaultValue: 1.75, xs: 12, sm: 6, unit: "", step: 0.01 },
    { name: "dry_allowed_length", label: "DRY Allowed Length", type: "number", defaultValue: 2, xs: 12, sm: 6, unit: "tokens", step: 1 },
    { name: "dry_penalty_last_n", label: "DRY Penalty Last N", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "tokens", step: 1 },
    { name: "dry_sequence_breaker", label: "DRY Sequence Breaker", type: "text", defaultValue: "\\n, !, ., ?", xs: 12, sm: 6 },
    { name: "dynatemp_range", label: "Dynatemp Range", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "dynatemp_exp", label: "Dynatemp Exp", type: "number", defaultValue: 1, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "mirostat", label: "Mirostat", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "mirostat_lr", label: "Mirostat LR", type: "number", defaultValue: 0.1, xs: 12, sm: 6, unit: "", step: 0.01 },
    { name: "mirostat_ent", label: "Mirostat Ent", type: "number", defaultValue: 5, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "samplers", label: "Samplers", type: "text", defaultValue: "", xs: 12 },
    { name: "sampler_seq", label: "Sampler Sequence", type: "text", defaultValue: "", xs: 12 },
    { name: "seed", label: "Seed", type: "number", defaultValue: -1, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "grammar", label: "Grammar", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "grammar_file", label: "Grammar File", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "json_schema", label: "JSON Schema", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "json_schema_file", label: "JSON Schema File", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "ignore_eos", label: "Ignore EOS", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "escape", label: "Escape", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
    { name: "rope_scaling_type", label: "ROPE Scaling Type", type: "select", options: ["", "linear", "yarn"], defaultValue: "", xs: 12, sm: 6 },
    { name: "rope_scale", label: "ROPE Scale", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "rope_freq_base", label: "ROPE Freq Base", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 100 },
    { name: "rope_freq_scale", label: "ROPE Freq Scale", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "yarn_orig_ctx", label: "YARN Orig Ctx", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "tokens", step: 1 },
    { name: "yarn_ext_factor", label: "YARN Ext Factor", type: "number", defaultValue: -1, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "yarn_attn_factor", label: "YARN Attn Factor", type: "number", defaultValue: 1, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "yarn_beta_slow", label: "YARN Beta Slow", type: "number", defaultValue: 1, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "yarn_beta_fast", label: "YARN Beta Fast", type: "number", defaultValue: 32, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "flash_attn", label: "Flash Attention", type: "select", options: ["", "0", "1"], defaultValue: "", xs: 12, sm: 6 },
    { name: "logit_bias", label: "Logit Bias", type: "text", defaultValue: "", xs: 12, sm: 6 },
  ],
  memory: [
    { name: "cache_ram", label: "Cache RAM", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "GB", step: 0.1 },
    { name: "cache_type_k", label: "Cache Type K", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "cache_type_v", label: "Cache Type V", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "mmap", label: "MMap", type: "number", defaultValue: 1, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "mlock", label: "MLock", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "numa", label: "NUMA", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "defrag_thold", label: "Defrag Threshold", type: "number", defaultValue: -1, xs: 12, sm: 6, unit: "", step: 0.01 },
  ],
  gpu: [
    { name: "device", label: "Device", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "list_devices", label: "List Devices", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "gpu_layers", label: "GPU Layers", type: "number", defaultValue: -1, xs: 12, sm: 6, unit: "layers", step: 1 },
    { name: "split_mode", label: "Split Mode", type: "select", options: ["", "layer", "row"], defaultValue: "", xs: 12, sm: 6 },
    { name: "tensor_split", label: "Tensor Split", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "main_gpu", label: "Main GPU", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "kv_offload", label: "KV Offload", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "repack", label: "Repack", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "no_host", label: "No Host", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
  ],
  advanced: [
    { name: "swa_full", label: "SWA Full", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "override_tensor", label: "Override Tensor", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "cpu_moe", label: "CPU MoE", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "n_cpu_moe", label: "N CPU MoE", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "kv_unified", label: "KV Unified", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "pooling", label: "Pooling", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "context_shift", label: "Context Shift", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "rpc", label: "RPC", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "offline", label: "Offline", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "override_kv", label: "Override KV", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "op_offload", label: "Op Offload", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "fit", label: "Fit", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "fit_target", label: "Fit Target", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "fit_ctx", label: "Fit Context", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "tokens", step: 1 },
    { name: "check_tensors", label: "Check Tensors", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "sleep_idle_seconds", label: "Sleep Idle Seconds", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "s", step: 1 },
    { name: "polling", label: "Polling", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "polling_batch", label: "Polling Batch", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "reasoning_format", label: "Reasoning Format", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "reasoning_budget", label: "Reasoning Budget", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "tokens", step: 1 },
    { name: "custom_params", label: "Custom Params", type: "text", defaultValue: "", xs: 12, sm: 6 },
  ],
  lora: [
    { name: "lora", label: "LoRA", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "lora_scaled", label: "LoRA Scaled", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "control_vector", label: "Control Vector", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "control_vector_scaled", label: "Control Vector Scaled", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "control_vector_layer_range", label: "Control Vector Layer Range", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "model_draft", label: "Model Draft", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "model_url_draft", label: "Model URL Draft", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "ctx_size_draft", label: "Context Size Draft", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "tokens", step: 1 },
    { name: "threads_draft", label: "Threads Draft", type: "number", defaultValue: -1, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "threads_batch_draft", label: "Threads Batch Draft", type: "number", defaultValue: -1, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "draft_max", label: "Draft Max", type: "number", defaultValue: 16, xs: 12, sm: 6, unit: "tokens", step: 1 },
    { name: "draft_min", label: "Draft Min", type: "number", defaultValue: 5, xs: 12, sm: 6, unit: "tokens", step: 1 },
    { name: "draft_p_min", label: "Draft P Min", type: "number", defaultValue: 0.05, xs: 12, sm: 6, unit: "", step: 0.01 },
    { name: "cache_type_k_draft", label: "Cache Type K Draft", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "cache_type_v_draft", label: "Cache Type V Draft", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "cpu_moe_draft", label: "CPU MoE Draft", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "n_cpu_moe_draft", label: "N CPU MoE Draft", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "n_gpu_layers_draft", label: "N GPU Layers Draft", type: "number", defaultValue: -1, xs: 12, sm: 6, unit: "layers", step: 1 },
    { name: "device_draft", label: "Device Draft", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "spec_replace", label: "Spec Replace", type: "text", defaultValue: "", xs: 12, sm: 6 },
  ],
  multimodal: [
    { name: "mmproj", label: "MMPROJ", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "mmproj_url", label: "MMPROJ URL", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "mmproj_auto", label: "MMPROJ Auto", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "mmproj_offload", label: "MMPROJ Offload", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "image_min_tokens", label: "Image Min Tokens", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "tokens", step: 1 },
    { name: "image_max_tokens", label: "Image Max Tokens", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "tokens", step: 1 },
  ],
};

export default function ModelConfigDialog({
  open,
  modelId,
  configType,
  config,
  onClose,
  onSave,
}: ModelConfigDialogProps) {
  const theme = useTheme();
  const [editedConfig, setEditedConfig] = useState<Record<string, unknown>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [sliderMode, setSliderMode] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Initialize config when dialog opens
  useEffect(() => {
    if (open && configType && config) {
      setEditedConfig({ ...config });
      setHasChanges(false);
      setErrors({});
    } else if (open && configType && !config) {
      // Use default values if no config provided
      const fields = configFields[configType];
      const defaults: Record<string, unknown> = {};
      const sliderModeDefaults: Record<string, boolean> = {};
      fields.forEach((field) => {
        defaults[field.name] = field.defaultValue;
        // Enable slider by default for numeric fields with step defined
        if (field.type === "number" && field.step !== undefined) {
          sliderModeDefaults[field.name] = true;
        }
      });
      setEditedConfig(defaults);
      setSliderMode(sliderModeDefaults);
      setHasChanges(false);
      setErrors({});
    }
  }, [open, configType, config]);

  // Validate single field
  const validateField = useCallback((fieldName: string, value: unknown): string | null => {
    const rule = validationRules[fieldName];
    if (!rule) return null;

    // Required check
    if (rule.required && (value === "" || value === null || value === undefined)) {
      return "This field is required";
    }

    // Type-specific validation
    if (typeof value === "number") {
      if (rule.min !== undefined && value < rule.min) {
        return `Value must be at least ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return `Value must be at most ${rule.max}`;
      }
    }

    if (rule.pattern && typeof value === "string") {
      if (!rule.pattern.test(value)) {
        return "Invalid format";
      }
    }

    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) return customError;
    }

    return null;
  }, []);

  // Validate all fields
  const validateAll = useCallback((configToValidate: Record<string, unknown>): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(configToValidate).forEach((fieldName) => {
      const error = validateField(fieldName, configToValidate[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validateField]);

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setEditedConfig((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    setHasChanges(true);

    // Clear error when field is modified
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    // Validate all fields before saving
    if (!validateAll(editedConfig)) {
      setNotification({
        open: true,
        message: "Please fix validation errors before saving",
        severity: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editedConfig);
      setHasChanges(false);
      setNotification({
        open: true,
        message: "Configuration saved successfully",
        severity: "success",
      });
    } catch {
      setNotification({
        open: true,
        message: "Failed to save configuration",
        severity: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setShowResetDialog(true);
  };

  const confirmReset = () => {
    const fields = configFields[configType!];
    const defaults: Record<string, unknown> = {};
    fields.forEach((field) => {
      defaults[field.name] = field.defaultValue;
    });
    setEditedConfig(defaults);
    setHasChanges(true);
    setErrors({});
    setShowResetDialog(false);
    setNotification({
      open: true,
      message: "Configuration reset to defaults",
      severity: "success",
    });
  };

  const toggleSliderMode = (fieldName: string) => {
    setSliderMode((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  // Format value for display
  const formatValue = (value: unknown, unit?: string): string => {
    if (typeof value === "number") {
      if (unit) {
        return `${value} ${unit}`;
      }
      // Format float numbers to 2 decimal places
      if (!Number.isInteger(value)) {
        return value.toFixed(2);
      }
      return value.toString();
    }
    return String(value);
  };

  const renderField = (field: FieldDefinition) => {
    const value = editedConfig[field.name] ?? field.defaultValue;
    const error = errors[field.name];
    const tooltipContent = configType ? getTooltipContent(configType, field.name) : undefined;
    const useSlider = field.type === "number" && sliderMode[field.name];

    switch (field.type) {
      case "text":
        return (
          <FieldWithTooltip content={tooltipContent!}>
            <Box>
              <TextField
                fullWidth
                size="small"
                label={field.label}
                value={value}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                variant="outlined"
                error={Boolean(error)}
                helperText={error}
                sx={{
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: theme.palette.primary.main,
                  },
                }}
              />
            </Box>
          </FieldWithTooltip>
        );

      case "number":
        return (
          <FieldWithTooltip content={tooltipContent!}>
            <Box>
              {useSlider && field.step !== undefined ? (
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {field.label}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: error ? theme.palette.error.main : theme.palette.primary.main,
                        }}
                      >
                        {formatValue(value, field.unit)}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => toggleSliderMode(field.name)}
                        aria-label={`Switch to input for ${field.label}`}
                        sx={{ padding: 0.5 }}
                      >
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>
                  <Slider
                    value={Number(value)}
                    onChange={(_event, newValue) => handleFieldChange(field.name, newValue)}
                    step={field.step}
                    min={validationRules[field.name]?.min ?? 0}
                    max={validationRules[field.name]?.max ?? 100}
                    marks={field.marks ?? []}
                    valueLabelDisplay="off"
                    sx={{
                      mb: 0.5,
                      "& .MuiSlider-thumb": {
                        "&:hover, &.Mui-focusVisible": {
                          boxShadow: `0 0 0 8px ${theme.palette.primary.main}20`,
                        },
                      },
                    }}
                  />
                  {error && (
                    <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
                      {error}
                    </Typography>
                  )}
                </Box>
              ) : (
                <TextField
                  fullWidth
                  size="small"
                  label={field.label}
                  type="number"
                  value={value}
                  onChange={(e) => handleFieldChange(field.name, Number.parseFloat(e.target.value) || 0)}
                  variant="outlined"
                  error={Boolean(error)}
                  helperText={error}
                  InputProps={{
                    endAdornment: field.unit ? (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                        {field.unit}
                      </Typography>
                    ) : field.step !== undefined ? (
                      <IconButton
                        size="small"
                        onClick={() => toggleSliderMode(field.name)}
                        aria-label={`Switch to slider for ${field.label}`}
                      >
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    ) : undefined,
                  }}
                  sx={{
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                />
              )}
            </Box>
          </FieldWithTooltip>
        );

      case "select":
        return (
          <FieldWithTooltip content={tooltipContent!}>
            <FormControl fullWidth size="small" error={Boolean(error)}>
              <InputLabel>{field.label}</InputLabel>
              <Select
                label={field.label}
                value={value}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                aria-label={`Select ${field.label}`}
                sx={{
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                {field.options?.map((option: string) => (
                  <MenuItem key={option} value={option}>
                    {option || "None"}
                  </MenuItem>
                ))}
              </Select>
              {error && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 0.75 }}>
                  {error}
                </Typography>
              )}
            </FormControl>
          </FieldWithTooltip>
        );

      case "boolean":
        return (
          <FieldWithTooltip content={tooltipContent!}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(value)}
                  onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                  aria-label={`Toggle ${field.label}`}
                  sx={{
                    transition: "transform 0.2s ease",
                    "&:hover": {
                      transform: "scale(1.05)",
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {field.label}
                </Typography>
              }
            />
          </FieldWithTooltip>
        );

      default:
        return null;
    }
  };

  const renderSection = (section: { title: string; icon: React.ReactNode; fields: string[] }) => {
    const isExpanded = expandedSections[section.title] !== false; // Expand all by default
    const sectionFields = section.fields
      .map((fieldName) => configFields[configType!].find((f) => f.name === fieldName))
      .filter(Boolean) as FieldDefinition[];

    return (
      <Accordion
        key={section.title}
        expanded={isExpanded}
        onChange={() => toggleSection(section.title)}
        elevation={0}
        sx={{
          backgroundColor: theme.palette.mode === "dark" ? "grey.900" : "grey.50",
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          mb: 1,
          "&:before": {
            display: "none",
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            minHeight: 56,
            "& .MuiAccordionSummary-content": {
              margin: "12px 0",
              fontWeight: 600,
            },
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                color: "primary.main",
                display: "flex",
                alignItems: "center",
              }}
            >
              {section.icon}
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {section.title}
            </Typography>
            <Chip
              label={sectionFields.length}
              size="small"
              sx={{
                ml: 1,
                height: 20,
                fontSize: "0.75rem",
                backgroundColor: "primary.main",
                color: "primary.contrastText",
              }}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            {sectionFields.map((field) => (
              <Grid
                key={field.name}
                size={{
                  xs: field.xs || 12,
                  sm: field.sm || 6,
                  md: field.md || 6,
                  lg: field.lg || 4,
                }}
              >
                {renderField(field)}
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  if (!configType || !configFields[configType]) {
    return null;
  }

  const configTitle = configType.charAt(0).toUpperCase() + configType.slice(1);
  const isValid = Object.keys(errors).length === 0;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[10],
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            pb: 2,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Configure {configTitle}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Model {modelId}
              </Typography>
            </Box>
            {hasChanges && (
              <Chip
                icon={<EditIcon />}
                label="Unsaved Changes"
                size="small"
                color="warning"
                sx={{ backgroundColor: "warning.light", color: "warning.dark" }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Box>
            {sectionGroups[configType].map((section) => renderSection(section))}
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleReset}
            startIcon={<RestoreIcon />}
            color="warning"
            sx={{
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: theme.palette.warning.main,
                color: theme.palette.warning.contrastText,
              },
            }}
          >
            Reset to Defaults
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            onClick={onClose}
            sx={{
              transition: "all 0.2s ease",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={!hasChanges || !isValid || isSaving}
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
            sx={{
              transition: "all 0.2s ease",
              minWidth: 140,
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: theme.shadows[4],
              },
              "&:active": {
                transform: "translateY(0)",
              },
            }}
          >
            {isSaving ? "Saving..." : "Save Configuration"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset confirmation dialog */}
      <Dialog
        open={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <RestoreIcon color="warning" />
            <Typography variant="h6">Reset to Defaults</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset all {configTitle} configuration to default values? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetDialog(false)}>Cancel</Button>
          <Button
            onClick={confirmReset}
            variant="contained"
            color="warning"
            startIcon={<RestoreIcon />}
          >
            Reset to Defaults
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
          severity={notification.severity}
          variant="filled"
          icon={notification.severity === "success" ? <CheckCircleIcon /> : <ErrorIcon />}
          sx={{
            borderRadius: 1,
            boxShadow: theme.shadows[6],
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}
