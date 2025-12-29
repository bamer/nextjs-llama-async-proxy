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
} from "@mui/material";
import { useEffect, useState } from "react";

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
  config: any;
  onClose: () => void;
  onSave: (config: any) => void;
}

// Field definitions for each config type
const configFields: Record<
  ConfigType,
  Array<{
    name: string;
    label: string;
    type: "text" | "number" | "select" | "boolean";
    options?: string[];
    defaultValue?: any;
    xs?: number;
    sm?: number;
    md?: number;
  }>
> = {
  sampling: [
    { name: "temperature", label: "Temperature", type: "number", defaultValue: 0.7, xs: 12, sm: 6 },
    { name: "top_k", label: "Top K", type: "number", defaultValue: 40, xs: 12, sm: 6 },
    { name: "top_p", label: "Top P", type: "number", defaultValue: 0.9, xs: 12, sm: 6 },
    { name: "min_p", label: "Min P", type: "number", defaultValue: 0.05, xs: 12, sm: 6 },
    { name: "top_nsigma", label: "Top N Sigma", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "xtc_probability", label: "XTC Probability", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "xtc_threshold", label: "XTC Threshold", type: "number", defaultValue: 0.1, xs: 12, sm: 6 },
    { name: "typical_p", label: "Typical P", type: "number", defaultValue: 1, xs: 12, sm: 6 },
    { name: "repeat_last_n", label: "Repeat Last N", type: "number", defaultValue: 64, xs: 12, sm: 6 },
    { name: "repeat_penalty", label: "Repeat Penalty", type: "number", defaultValue: 1, xs: 12, sm: 6 },
    { name: "presence_penalty", label: "Presence Penalty", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "frequency_penalty", label: "Frequency Penalty", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "dry_multiplier", label: "DRY Multiplier", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "dry_base", label: "DRY Base", type: "number", defaultValue: 1.75, xs: 12, sm: 6 },
    { name: "dry_allowed_length", label: "DRY Allowed Length", type: "number", defaultValue: 2, xs: 12, sm: 6 },
    { name: "dry_penalty_last_n", label: "DRY Penalty Last N", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "dry_sequence_breaker", label: "DRY Sequence Breaker", type: "text", defaultValue: "\\n, !, ., ?", xs: 12, sm: 6 },
    { name: "dynatemp_range", label: "Dynatemp Range", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "dynatemp_exp", label: "Dynatemp Exp", type: "number", defaultValue: 1, xs: 12, sm: 6 },
    { name: "mirostat", label: "Mirostat", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "mirostat_lr", label: "Mirostat LR", type: "number", defaultValue: 0.1, xs: 12, sm: 6 },
    { name: "mirostat_ent", label: "Mirostat Ent", type: "number", defaultValue: 5, xs: 12, sm: 6 },
    { name: "samplers", label: "Samplers", type: "text", defaultValue: "", xs: 12 },
    { name: "sampler_seq", label: "Sampler Sequence", type: "text", defaultValue: "", xs: 12 },
    { name: "seed", label: "Seed", type: "number", defaultValue: -1, xs: 12, sm: 6 },
    { name: "grammar", label: "Grammar", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "grammar_file", label: "Grammar File", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "json_schema", label: "JSON Schema", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "json_schema_file", label: "JSON Schema File", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "ignore_eos", label: "Ignore EOS", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "escape", label: "Escape", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
    { name: "rope_scaling_type", label: "ROPE Scaling Type", type: "select", options: ["", "linear", "yarn"], defaultValue: "", xs: 12, sm: 6 },
    { name: "rope_scale", label: "ROPE Scale", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "rope_freq_base", label: "ROPE Freq Base", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "rope_freq_scale", label: "ROPE Freq Scale", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "yarn_orig_ctx", label: "YARN Orig Ctx", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "yarn_ext_factor", label: "YARN Ext Factor", type: "number", defaultValue: -1, xs: 12, sm: 6 },
    { name: "yarn_attn_factor", label: "YARN Attn Factor", type: "number", defaultValue: 1, xs: 12, sm: 6 },
    { name: "yarn_beta_slow", label: "YARN Beta Slow", type: "number", defaultValue: 1, xs: 12, sm: 6 },
    { name: "yarn_beta_fast", label: "YARN Beta Fast", type: "number", defaultValue: 32, xs: 12, sm: 6 },
    { name: "flash_attn", label: "Flash Attention", type: "select", options: ["", "0", "1"], defaultValue: "", xs: 12, sm: 6 },
    { name: "logit_bias", label: "Logit Bias", type: "text", defaultValue: "", xs: 12, sm: 6 },
  ],
  memory: [
    { name: "cache_ram", label: "Cache RAM", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "cache_type_k", label: "Cache Type K", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "cache_type_v", label: "Cache Type V", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "mmap", label: "MMap", type: "number", defaultValue: 1, xs: 12, sm: 6 },
    { name: "mlock", label: "MLock", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "numa", label: "NUMA", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "defrag_thold", label: "Defrag Threshold", type: "number", defaultValue: -1, xs: 12, sm: 6 },
  ],
  gpu: [
    { name: "device", label: "Device", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "list_devices", label: "List Devices", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "gpu_layers", label: "GPU Layers", type: "number", defaultValue: -1, xs: 12, sm: 6 },
    { name: "split_mode", label: "Split Mode", type: "select", options: ["", "layer", "row"], defaultValue: "", xs: 12, sm: 6 },
    { name: "tensor_split", label: "Tensor Split", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "main_gpu", label: "Main GPU", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "kv_offload", label: "KV Offload", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "repack", label: "Repack", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "no_host", label: "No Host", type: "number", defaultValue: 0, xs: 12, sm: 6 },
  ],
  advanced: [
    { name: "swa_full", label: "SWA Full", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "override_tensor", label: "Override Tensor", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "cpu_moe", label: "CPU MoE", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "n_cpu_moe", label: "N CPU MoE", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "kv_unified", label: "KV Unified", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "pooling", label: "Pooling", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "context_shift", label: "Context Shift", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "rpc", label: "RPC", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "offline", label: "Offline", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "override_kv", label: "Override KV", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "op_offload", label: "Op Offload", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "fit", label: "Fit", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "fit_target", label: "Fit Target", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "fit_ctx", label: "Fit Context", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "check_tensors", label: "Check Tensors", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "sleep_idle_seconds", label: "Sleep Idle Seconds", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "polling", label: "Polling", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "polling_batch", label: "Polling Batch", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "reasoning_format", label: "Reasoning Format", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "reasoning_budget", label: "Reasoning Budget", type: "number", defaultValue: 0, xs: 12, sm: 6 },
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
    { name: "ctx_size_draft", label: "Context Size Draft", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "threads_draft", label: "Threads Draft", type: "number", defaultValue: -1, xs: 12, sm: 6 },
    { name: "threads_batch_draft", label: "Threads Batch Draft", type: "number", defaultValue: -1, xs: 12, sm: 6 },
    { name: "draft_max", label: "Draft Max", type: "number", defaultValue: 16, xs: 12, sm: 6 },
    { name: "draft_min", label: "Draft Min", type: "number", defaultValue: 5, xs: 12, sm: 6 },
    { name: "draft_p_min", label: "Draft P Min", type: "number", defaultValue: 0.05, xs: 12, sm: 6 },
    { name: "cache_type_k_draft", label: "Cache Type K Draft", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "cache_type_v_draft", label: "Cache Type V Draft", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "cpu_moe_draft", label: "CPU MoE Draft", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "n_cpu_moe_draft", label: "N CPU MoE Draft", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "n_gpu_layers_draft", label: "N GPU Layers Draft", type: "number", defaultValue: -1, xs: 12, sm: 6 },
    { name: "device_draft", label: "Device Draft", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "spec_replace", label: "Spec Replace", type: "text", defaultValue: "", xs: 12, sm: 6 },
  ],
  multimodal: [
    { name: "mmproj", label: "MMPROJ", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "mmproj_url", label: "MMPROJ URL", type: "text", defaultValue: "", xs: 12, sm: 6 },
    { name: "mmproj_auto", label: "MMPROJ Auto", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "mmproj_offload", label: "MMPROJ Offload", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "image_min_tokens", label: "Image Min Tokens", type: "number", defaultValue: 0, xs: 12, sm: 6 },
    { name: "image_max_tokens", label: "Image Max Tokens", type: "number", defaultValue: 0, xs: 12, sm: 6 },
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
  const [editedConfig, setEditedConfig] = useState<any>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize config when dialog opens
  useEffect(() => {
    if (open && configType && config) {
      setEditedConfig({ ...config });
      setHasChanges(false);
    } else if (open && configType && !config) {
      // Use default values if no config provided
      const fields = configFields[configType];
      const defaults: any = {};
      fields.forEach((field) => {
        if (field.defaultValue !== undefined) {
          defaults[field.name] = field.defaultValue;
        }
      });
      setEditedConfig(defaults);
      setHasChanges(false);
    }
  }, [open, configType, config]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setEditedConfig((prev: any) => ({
      ...prev,
      [fieldName]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(editedConfig);
    setHasChanges(false);
  };

  const renderField = (field: any) => {
    const value = editedConfig[field.name] ?? field.defaultValue;

    switch (field.type) {
      case "text":
        return (
          <TextField
            fullWidth
            size="small"
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            variant="outlined"
          />
        );

      case "number":
        return (
          <TextField
            fullWidth
            size="small"
            label={field.label}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, Number.parseFloat(e.target.value) || 0)}
            variant="outlined"
          />
        );

      case "select":
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{field.label}</InputLabel>
            <Select
              label={field.label}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
            >
              {field.options?.map((option: string) => (
                <MenuItem key={option} value={option}>
                  {option || "None"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case "boolean":
        return (
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(value)}
                onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              />
            }
            label={field.label}
          />
        );

      default:
        return null;
    }
  };

  if (!configType || !configFields[configType]) {
    return null;
  }

  const fields = configFields[configType];
  const configTitle = configType.charAt(0).toUpperCase() + configType.slice(1);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          Configure {configTitle} for Model {modelId}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {fields.map((field) => (
              <Grid
                key={field.name}
                size={{ xs: field.xs || 12, sm: field.sm || 6, md: field.md || 6 }}
              >
                {renderField(field)}
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={!hasChanges}
        >
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
}
