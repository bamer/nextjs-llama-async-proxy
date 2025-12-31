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
import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { getTooltipContent, TooltipContent as TooltipContentType } from "@/config/tooltip-config";
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

// Import TooltipContent type
import { TooltipContent } from "@/config/tooltip-config";

// Memoized Field Components
const MemoizedTextField = memo(({
  field,
  value,
  error,
  tooltipContent,
  onChange,
}: {
  field: FieldDefinition;
  value: unknown;
  error?: string;
  tooltipContent?: TooltipContentType;
  onChange: (name: string, value: unknown) => void;
}) => (
  <FieldWithTooltip content={tooltipContent as TooltipContentType}>
    <Box>
      <TextField
        fullWidth
        size="small"
        label={field.label}
        value={value}
        onChange={(e) => onChange(field.name, e.target.value)}
        variant="outlined"
        error={Boolean(error)}
        helperText={error}
        sx={{
          transition: "all 0.2s ease",
        }}
      />
    </Box>
  </FieldWithTooltip>
));

MemoizedTextField.displayName = "MemoizedTextField";

const MemoizedBooleanField = memo(({
  field,
  value,
  tooltipContent,
  onChange,
}: {
  field: FieldDefinition;
  value: unknown;
  tooltipContent?: TooltipContentType;
  onChange: (name: string, value: unknown) => void;
}) => (
  <FieldWithTooltip content={tooltipContent as TooltipContentType}>
    <FormControlLabel
      control={
        <Switch
          checked={Boolean(value)}
          onChange={(e) => onChange(field.name, e.target.checked)}
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
));

MemoizedBooleanField.displayName = "MemoizedBooleanField";

const MemoizedSelectField = memo(({
  field,
  value,
  error,
  tooltipContent,
  theme,
  onChange,
}: {
  field: FieldDefinition;
  value: unknown;
  error?: string;
  tooltipContent?: TooltipContentType;
  theme: any;
  onChange: (name: string, value: unknown) => void;
}) => (
  <FieldWithTooltip content={tooltipContent as TooltipContentType}>
    <FormControl fullWidth size="small" error={Boolean(error)}>
      <InputLabel>{field.label}</InputLabel>
      <Select
        label={field.label}
        value={value}
        onChange={(e) => onChange(field.name, e.target.value)}
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
));

MemoizedSelectField.displayName = "MemoizedSelectField";

// Section groups for accordion organization
const sectionGroups: Record<ConfigType, Array<{ title: string; icon: React.ReactNode; fields: string[] }>> = {
  sampling: [
    {
      title: "Échantillonnage Principal",
      icon: <SpeedIcon />,
      fields: ["temperature", "top_k", "top_p", "min_p", "typical_p"],
    },
    {
      title: "Contrôle de Répétition",
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
      title: "Échantillonnage Avancé",
      icon: <SettingsIcon />,
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
      title: "Extension de Contexte (ROPE)",
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
      title: "Paramètres de Cache",
      icon: <MemoryIcon />,
      fields: ["cache_ram", "cache_type_k", "cache_type_v"],
    },
    {
      title: "Gestion de la Mémoire",
      icon: <SettingsIcon />,
      fields: ["mmap", "mlock", "numa", "defrag_thold"],
    },
  ],
  gpu: [
    {
      title: "Sélection de Périphérique",
      icon: <GpuIcon />,
      fields: ["device", "list_devices"],
    },
    {
      title: "Configuration GPU",
      icon: <SettingsIcon />,
      fields: ["gpu_layers", "split_mode", "tensor_split", "main_gpu", "kv_offload"],
    },
    {
      title: "Options de Performance",
      icon: <SpeedIcon />,
      fields: ["repack", "no_host"],
    },
  ],
  advanced: [
    {
      title: "Comportement du Modèle",
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
      title: "Calcul Distribué",
      icon: <GpuIcon />,
      fields: ["rpc", "offline", "override_kv", "op_offload"],
    },
    {
      title: "Ajustement du Modèle",
      icon: <TuneIcon />,
      fields: ["fit", "fit_target", "fit_ctx", "check_tensors"],
    },
    {
      title: "Gestion des Ressources",
      icon: <MemoryIcon />,
      fields: ["sleep_idle_seconds", "polling", "polling_batch"],
    },
    {
      title: "Raisonnement",
      icon: <LayersIcon />,
      fields: ["reasoning_format_value_format", "reasoning_budget", "custom_params"],
    },
  ],
  lora: [
    {
      title: "Adaptateurs LoRA",
      icon: <LayersIcon />,
      fields: ["lora", "lora_scaled"],
    },
    {
      title: "Vecteurs de Contrôle",
      icon: <TuneIcon />,
      fields: [
        "control_vector",
        "control_vector_scaled",
        "control_vector_layer_range",
      ],
    },
    {
      title: "Décodage Spéculatif",
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
      title: "Cache du Modèle de Brouillon",
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
      title: "Options de Décodage Spéculatif",
      icon: <SettingsIcon />,
      fields: ["spec_replace"],
    },
  ],
  multimodal: [
    {
      title: "Projection Visuelle",
      icon: <ImageIcon />,
      fields: ["mmproj", "mmproj_url", "mmproj_auto", "mmproj_offload"],
    },
    {
      title: "Traitement d'Images",
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
    dynatemp_exponent: { min: 0.1, max: 2, required: false },
    mirostat: { min: 0, max: 2, required: false },
    mirostat_eta: { min: 0.001, max: 1, required: false },
    mirostat_tau: { min: 0, max: 10, required: false },
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
    { name: "temperature", label: "Température", type: "number", defaultValue: 0.7, xs: 12, sm: 6, unit: "", step: 0.01, marks: [{ value: 0, label: "0" }, { value: 1, label: "1" }, { value: 2, label: "2" }] },
    { name: "top_k", label: "Top K", type: "number", defaultValue: 40, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "top_p", label: "Top P", type: "number", defaultValue: 0.9, xs: 12, sm: 6, unit: "", step: 0.01, marks: [{ value: 0, label: "0" }, { value: 1, label: "1" }] },
    { name: "min_p", label: "Min P", type: "number", defaultValue: 0.05, xs: 12, sm: 6, unit: "", step: 0.01 },
    { name: "top_nsigma", label: "Top N Sigma", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "xtc_probability", label: "Probabilité XTC", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 0.01, marks: [{ value: 0, label: "0" }, { value: 1, label: "1" }] },
    { name: "xtc_threshold", label: "Seuil XTC", type: "number", defaultValue: 0.1, xs: 12, sm: 6, unit: "", step: 0.01 },
    { name: "typical_p", label: "Typical P", type: "number", defaultValue: 1, xs: 12, sm: 6, unit: "", step: 0.01, marks: [{ value: 0, label: "0" }, { value: 1, label: "1" }] },
    { name: "repeat_last_n", label: "Répéter Dernier N", type: "number", defaultValue: 64, xs: 12, sm: 6, unit: "tokens", step: 1 },
    { name: "repeat_penalty", label: "Pénalité de Répétition", type: "number", defaultValue: 1, xs: 12, sm: 6, unit: "", step: 0.01, marks: [{ value: 1, label: "1.0" }, { value: 1.5, label: "1.5" }, { value: 2, label: "2.0" }] },
    { name: "presence_penalty", label: "Pénalité de Présence", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "frequency_penalty", label: "Pénalité de Fréquence", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "dry_multiplier", label: "Multiplicateur DRY", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "dry_base", label: "Base DRY", type: "number", defaultValue: 1.75, xs: 12, sm: 6, unit: "", step: 0.01 },
    { name: "dry_allowed_length", label: "Longueur Autorisée DRY", type: "number", defaultValue: 2, xs: 12, sm: 6, unit: "tokens", step: 1 },
    { name: "dry_penalty_last_n", label: "Pénalité Dernier N DRY", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "tokens", step: 1 },
    { name: "dry_sequence_breaker", label: "Séparateur de Séquence DRY", type: "text", defaultValue: "\\n, !, ., ?", xs: 12, sm: 6 },
    { name: "dynatemp_range", label: "Plage Dynatemp", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "dynatemp_exp", label: "Exp Dynatemp", type: "number", defaultValue: 1, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "mirostat", label: "Mirostat", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "mirostat_lr", label: "LR Mirostat", type: "number", defaultValue: 0.1, xs: 12, sm: 6, unit: "", step: 0.01 },
    { name: "mirostat_ent", label: "Ent Mirostat", type: "number", defaultValue: 5, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "samplers", label: "Échantillonneurs", type: "text", defaultValue: "", xs: 12 },
    { name: "sampler_seq", label: "Séquence d'Échantillonnage", type: "text", defaultValue: "", xs: 12 },
    { name: "seed", label: "Graine", type: "number", defaultValue: -1, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "grammar", label: "Grammaire", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "grammar_file", label: "Fichier de Grammaire", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "json_schema", label: "Schéma JSON", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "json_schema_file", label: "Fichier de Schéma JSON", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "ignore_eos", label: "Ignorer Token EOS", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
    { name: "escape", label: "Échappement", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
    { name: "rope_scaling_type", label: "Type de Mise à l'Échelle ROPE", type: "select", options: ["", "linear", "yarn"], defaultValue: "", xs: 12, sm: 6 },
    { name: "rope_scale", label: "Échelle ROPE", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "rope_freq_base", label: "Base Fréquence ROPE", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 100 },
    { name: "rope_freq_scale", label: "Échelle Fréquence ROPE", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "yarn_orig_ctx", label: "Ctx Original YARN", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "tokens", step: 1 },
    { name: "yarn_ext_factor", label: "Facteur Extension YARN", type: "number", defaultValue: -1, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "yarn_attn_factor", label: "Facteur Attention YARN", type: "number", defaultValue: 1, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "yarn_beta_slow", label: "Beta Lent YARN", type: "number", defaultValue: 1, xs: 12, sm: 6, unit: "", step: 0.1 },
    { name: "yarn_beta_fast", label: "Beta Rapide YARN", type: "number", defaultValue: 32, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "flash_attn", label: "Attention Flash", type: "select", options: ["", "0", "1"], defaultValue: "", xs: 12, sm: 6 },
    { name: "logit_bias", label: "Biais Logit", type: "text", defaultValue: "", xs: 12, sm: 6 },
  ],
  memory: [
    { name: "cache_ram", label: "Cache RAM", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "Go", step: 0.1 },
    { name: "cache_type_k", label: "Type de Cache K", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "cache_type_v", label: "Type de Cache V", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "mmap", label: "MMap (Cartographie Mémoire)", type: "boolean", defaultValue: true, xs: 12, sm: 6 },
    { name: "mlock", label: "MLock (Verrou Mémoire)", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
    { name: "numa", label: "NUMA", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "defrag_thold", label: "Seuil de Défragmentation", type: "number", defaultValue: -1, xs: 12, sm: 6, unit: "", step: 0.01 },
  ],
  gpu: [
    { name: "device", label: "Périphérique", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "list_devices", label: "Lister les Périphériques", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
    { name: "gpu_layers", label: "Couches GPU", type: "number", defaultValue: -1, xs: 12, sm: 6, unit: "couches", step: 1 },
    { name: "split_mode", label: "Mode de Partage", type: "select", options: ["", "layer", "row"], defaultValue: "", xs: 12, sm: 6 },
    { name: "tensor_split", label: "Répartition Tensor", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "main_gpu", label: "GPU Principal", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "kv_offload", label: "Déchargement KV", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "repack", label: "Réempaqueter", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
    { name: "no_host", label: "Pas d'Hôte", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
  ],
  advanced: [
    { name: "swa_full", label: "SWA Complet", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
    { name: "override_tensor", label: "Surcharger Tenseur", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "cpu_moe", label: "CPU MoE", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
    { name: "n_cpu_moe", label: "N CPU MoE", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "kv_unified", label: "KV Unifié", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
    { name: "pooling", label: "Mise en Commun", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "context_shift", label: "Décalage de Contexte", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
    { name: "rpc", label: "RPC", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "offline", label: "Mode Hors Ligne", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
    { name: "override_kv", label: "Surcharger KV", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "op_offload", label: "Déchargement Op", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
    { name: "fit", label: "Ajuster", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "fit_target", label: "Cible d'Ajustement", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "fit_ctx", label: "Contexte d'Ajustement", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "tokens", step: 1 },
    { name: "check_tensors", label: "Vérifier Tenseurs", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
    { name: "sleep_idle_seconds", label: "Secondes de Veille", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "s", step: 1 },
    { name: "polling", label: "Interrogation", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "polling_batch", label: "Traitement par Lot", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "reasoning_format", label: "Format de Raisonnement", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "reasoning_budget", label: "Budget de Raisonnement", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "tokens", step: 1 },
    { name: "custom_params", label: "Paramètres Personnalisés", type: "text", defaultValue: "", xs: 12, sm: 6 },
  ],
  lora: [
    { name: "lora", label: "LoRA", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "lora_scaled", label: "LoRA Mis à l'Échelle", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "control_vector", label: "Vecteur de Contrôle", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "control_vector_scaled", label: "Vecteur de Contrôle Mis à l'Échelle", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "control_vector_layer_range", label: "Plage de Couches Vecteur de Contrôle", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "model_draft", label: "Modèle de Brouillon", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "model_url_draft", label: "URL du Modèle de Brouillon", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "ctx_size_draft", label: "Taille du Contexte de Brouillon", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "tokens", step: 1 },
    { name: "threads_draft", label: "Threads de Brouillon", type: "number", defaultValue: -1, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "threads_batch_draft", label: "Threads par Lot de Brouillon", type: "number", defaultValue: -1, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "draft_max", label: "Brouillon Maximum", type: "number", defaultValue: 16, xs: 12, sm: 6, unit: "tokens", step: 1 },
    { name: "draft_min", label: "Brouillon Minimum", type: "number", defaultValue: 5, xs: 12, sm: 6, unit: "tokens", step: 1 },
    { name: "draft_p_min", label: "P Min de Brouillon", type: "number", defaultValue: 0.05, xs: 12, sm: 6, unit: "", step: 0.01 },
    { name: "cache_type_k_draft", label: "Type de Cache K Brouillon", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "cache_type_v_draft", label: "Type de Cache V Brouillon", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "cpu_moe_draft", label: "CPU MoE Brouillon", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "n_cpu_moe_draft", label: "N CPU MoE Brouillon", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
    { name: "n_gpu_layers_draft", label: "N Couches GPU Brouillon", type: "number", defaultValue: -1, xs: 12, sm: 6, unit: "couches", step: 1 },
    { name: "device_draft", label: "Périphérique Brouillon", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "spec_replace", label: "Remplacement Spéculatif", type: "text", defaultValue: "", xs: 12, sm: 6 },
  ],
  multimodal: [
    { name: "mmproj", label: "Projecteur Multimodal", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "mmproj_url", label: "URL du Projecteur Multimodal", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "mmproj_auto", label: "Détection Auto MMPROJ", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
    { name: "mmproj_offload", label: "Déchargement MMPROJ", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
    { name: "image_min_tokens", label: "Tokens Min d'Image", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "tokens", step: 1 },
    { name: "image_max_tokens", label: "Tokens Max d'Image", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "tokens", step: 1 },
  ],
};

// Export sectionGroups for use in ModelsPage sidebar
export { sectionGroups };

const ModelConfigDialogComponent = function ModelConfigDialog({
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

  // Helper function to convert database config to UI format
  const convertConfigFromDatabase = useCallback((config: Record<string, unknown>): Record<string, unknown> => {
    const converted: Record<string, unknown> = { ...config };

    // Fields that are stored as numbers in database but should be boolean in UI
    const numberToBooleanFields = [
      "mmap", "mlock", "list_devices", "repack", "no_host",
      "swa_full", "cpu_moe", "kv_unified", "context_shift", "offline",
      "op_offload", "check_tensors", "mmproj_auto", "mmproj_offload", "ignore_eos"
    ];

    numberToBooleanFields.forEach((field) => {
      if (typeof converted[field] === "number") {
        converted[field] = (converted[field] as number) !== 0;
      }
    });

    return converted;
  }, []);

  // Initialize config when dialog opens
  useEffect(() => {
    if (open && configType && config) {
      // Convert database config to UI format (numbers -> booleans)
      const uiConfig = convertConfigFromDatabase(config);
      setEditedConfig(uiConfig);
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
  }, [open, configType, config, convertConfigFromDatabase]);

  // Validate single field
  const validateField = useCallback((fieldName: string, value: unknown): string | null => {
    const rule = validationRules[fieldName];
    if (!rule) return null;

    // Required check
    if (rule.required && (value === "" || value === null || value === undefined)) {
      return "Ce champ est requis";
    }

    // Type-specific validation
    if (typeof value === "number") {
      if (rule.min !== undefined && value < rule.min) {
        return `La valeur doit être au moins ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return `La valeur doit être au plus ${rule.max}`;
      }
    }

    if (rule.pattern && typeof value === "string") {
      if (!rule.pattern.test(value)) {
        return "Format invalide";
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

  // Helper function to convert config for database compatibility
  const convertConfigForDatabase = useCallback((config: Record<string, unknown>): Record<string, unknown> => {
    const converted: Record<string, unknown> = { ...config };

    // Fields that are boolean in UI but stored as numbers in database
    const booleanToNumberFields = [
      "mmap", "mlock", "list_devices", "repack", "no_host",
      "swa_full", "cpu_moe", "kv_unified", "context_shift", "offline",
      "op_offload", "check_tensors", "mmproj_auto", "mmproj_offload", "ignore_eos"
    ];

    booleanToNumberFields.forEach((field) => {
      if (typeof converted[field] === "boolean") {
        converted[field] = (converted[field] as boolean) ? 1 : 0;
      }
    });

    return converted;
  }, []);

  const handleSave = async () => {
    // Validate all fields before saving
    if (!validateAll(editedConfig)) {
      setNotification({
        open: true,
        message: "Veuillez corriger les erreurs de validation avant de sauvegarder",
        severity: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Convert boolean values to numbers for database compatibility
      const dbConfig = convertConfigForDatabase(editedConfig);
      await onSave(dbConfig);
      setHasChanges(false);
      setNotification({
        open: true,
        message: "Configuration sauvegardée avec succès",
        severity: "success",
      });
    } catch {
      setNotification({
        open: true,
        message: "Échec de la sauvegarde de la configuration",
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
      message: "Configuration réinitialisée aux valeurs par défaut",
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
        return tooltipContent ? (
          <MemoizedTextField
            field={field}
            value={value}
            error={error}
            tooltipContent={tooltipContent}
            onChange={handleFieldChange}
          />
        ) : null;

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
        return tooltipContent ? (
          <MemoizedSelectField
            field={field}
            value={value}
            error={error}
            tooltipContent={tooltipContent}
            theme={theme}
            onChange={handleFieldChange}
          />
        ) : null;

      case "boolean":
        return tooltipContent ? (
          <MemoizedBooleanField
            field={field}
            value={value}
            tooltipContent={tooltipContent}
            onChange={handleFieldChange}
          />
        ) : null;

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
                Configurer {configTitle}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Modèle {modelId}
              </Typography>
            </Box>
            {hasChanges && (
              <Chip
                icon={<EditIcon />}
                label="Modifications Non Sauvegardées"
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
            Réinitialiser aux Valeurs par Défaut
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            onClick={onClose}
            sx={{
              transition: "all 0.2s ease",
            }}
          >
            Annuler
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
            {isSaving ? "Sauvegarde..." : "Sauvegarder la Configuration"}
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
            <Typography variant="h6">Réinitialiser aux Valeurs par Défaut</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir réinitialiser toute la configuration {configTitle} aux valeurs par défaut ? Cette action ne peut pas être annulée.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetDialog(false)}>Annuler</Button>
          <Button
            onClick={confirmReset}
            variant="contained"
            color="warning"
            startIcon={<RestoreIcon />}
          >
            Réinitialiser aux Valeurs par Défaut
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
};

// Memoize the entire component to prevent unnecessary re-renders
export default memo(ModelConfigDialogComponent);
