"use client";

/* eslint-disable react-hooks/set-state-in-effect */
// We intentionally call setState in useEffect to sync local state with props when dialog opens.
// This is a valid React pattern for initializing component state from props.

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Slider,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Grid,
  Tooltip,
  Divider,
} from "@mui/material";

// ============================================================================
// TypeScript Interfaces for Configuration Types
// ============================================================================

export interface SamplingConfig {
  temperature: number;
  top_p: number;
  top_k: number;
  min_p: number;
  typical_p: number;
  repeat_penalty: number;
  repeat_last_n: number;
  frequency_penalty: number;
  presence_penalty: number;
  mirostat: number;
  mirostat_tau: number;
  mirostat_eta: number;
  seed: number;
}

export interface MemoryConfig {
  num_ctx: number;
  num_batch: number;
  cache_ram: number;
  memory_f16: boolean;
  memory_lock: boolean;
}

export interface GPUConfig {
  n_gpu_layers: number;
  n_gpu: number;
  tensor_split: string;
  main_gpu: number;
  mm_lock: boolean;
}

export interface AdvancedConfig {
  rope_frequency: number;
  rope_scale: number;
  yarn_ext_factor: number;
  yarn_orig_ctx: number;
  yarn_attn_factor: number;
  yarn_beta_fast: number;
  yarn_beta_slow: number;
  num_thread: number;
  num_predict: number;
}

export interface LoRAConfig {
  lora_adapter: string;
  lora_base: string;
  lora_scale: number;
  control_vectors: string;
}

export interface MultimodalConfig {
  image_data: string;
  clip_vision_cache: boolean;
  mmproj: string;
}

export type ConfigType = "sampling" | "memory" | "gpu" | "advanced" | "lora" | "multimodal";

export interface ModelConfigDialogProps {
  open: boolean;
  modelId: number;
  configType: ConfigType;
  config?: SamplingConfig | MemoryConfig | GPUConfig | AdvancedConfig | LoRAConfig | MultimodalConfig;
  onClose: () => void;
  onSave: (config: SamplingConfig | MemoryConfig | GPUConfig | AdvancedConfig | LoRAConfig | MultimodalConfig) => void;
}

// ============================================================================
// Default Configurations
// ============================================================================

const DEFAULT_SAMPLING: SamplingConfig = {
  temperature: 0.7,
  top_p: 0.9,
  top_k: 40,
  min_p: 0.05,
  typical_p: 1.0,
  repeat_penalty: 1.1,
  repeat_last_n: 64,
  frequency_penalty: 0.0,
  presence_penalty: 0.0,
  mirostat: 0,
  mirostat_tau: 5.0,
  mirostat_eta: 0.1,
  seed: -1,
};

const DEFAULT_MEMORY: MemoryConfig = {
  num_ctx: 2048,
  num_batch: 512,
  cache_ram: 0,
  memory_f16: true,
  memory_lock: false,
};

const DEFAULT_GPU: GPUConfig = {
  n_gpu_layers: -1,
  n_gpu: 1,
  tensor_split: "",
  main_gpu: 0,
  mm_lock: false,
};

const DEFAULT_ADVANCED: AdvancedConfig = {
  rope_frequency: 10000,
  rope_scale: 1.0,
  yarn_ext_factor: -1,
  yarn_orig_ctx: 0,
  yarn_attn_factor: 1.0,
  yarn_beta_fast: 32,
  yarn_beta_slow: 1,
  num_thread: 8,
  num_predict: -1,
};

const DEFAULT_LORA: LoRAConfig = {
  lora_adapter: "",
  lora_base: "",
  lora_scale: 1.0,
  control_vectors: "",
};

const DEFAULT_MULTIMODAL: MultimodalConfig = {
  image_data: "",
  clip_vision_cache: false,
  mmproj: "",
};

// ============================================================================
// Parameter Descriptions for Tooltips
// ============================================================================

const PARAM_DESCRIPTIONS = {
  temperature: "Controls randomness in output. Lower values make output more deterministic, higher values more random.",
  top_p: "Nucleus sampling parameter. Limits sampling to tokens comprising the top p probability mass.",
  top_k: "Limits next token selection to the K most probable tokens. 0 disables this limit.",
  min_p: "Minimum probability threshold. Tokens with probability below this are excluded.",
  typical_p: "Locally typical sampling parameter. Controls how typical the next token is.",
  repeat_penalty: "Penalty for repeating tokens. Higher values reduce repetition.",
  repeat_last_n: "Number of last tokens to consider for repeat penalty.",
  frequency_penalty: "Penalty based on token frequency. Higher values penalize frequent tokens.",
  presence_penalty: "Penalty for token presence regardless of frequency.",
  mirostat: "Mirostat sampling algorithm. 0=disabled, 1=Mirostat, 2=Mirostat 2.0.",
  mirostat_tau: "Mirostat target entropy (surprise). Lower values produce less random output.",
  mirostat_eta: "Mirostat learning rate. Controls how quickly the algorithm adapts.",
  seed: "Random seed for generation. -1 uses random seed.",
  num_ctx: "Context window size. Number of tokens the model can consider.",
  num_batch: "Batch size for prompt processing. Larger values can improve performance.",
  cache_ram: "Cache RAM limit in MB. 0 means unlimited.",
  memory_f16: "Use 16-bit floating point for memory. Reduces memory usage.",
  memory_lock: "Lock memory in RAM to prevent swapping.",
  n_gpu_layers: "Number of layers to offload to GPU. -1 means all layers.",
  n_gpu: "Number of GPUs to use.",
  tensor_split: "Comma-separated list of how to split tensors across GPUs.",
  main_gpu: "Main GPU device ID.",
  mm_lock: "Lock multimodal tensors in VRAM.",
  rope_frequency: "RoPE frequency base. Adjusts positional encoding frequency.",
  rope_scale: "RoPE scaling factor. Adjusts context length scaling.",
  yarn_ext_factor: "YaRN extension factor for context length extension.",
  yarn_orig_ctx: "Original context length for YaRN scaling.",
  yarn_attn_factor: "YaRN attention scaling factor.",
  yarn_beta_fast: "YaRN fast beta parameter.",
  yarn_beta_slow: "YaRN slow beta parameter.",
  num_thread: "Number of threads to use for computation.",
  num_predict: "Maximum number of tokens to predict. -1 for unlimited.",
  lora_adapter: "Path to LoRA adapter file.",
  lora_base: "Base model path for LoRA adapter.",
  lora_scale: "Scaling factor for LoRA adapter.",
  control_vectors: "Paths to control vector files.",
  image_data: "Image data or path for multimodal input.",
  clip_vision_cache: "Cache CLIP vision model in memory.",
  mmproj: "Path to multimodal projection model.",
};

// ============================================================================
// Helper Components
// ============================================================================

interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  description?: string;
}

const SliderField = ({ label, value, onChange, min, max, step, description }: SliderFieldProps) => {
  const input = (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {value.toFixed(step >= 1 ? 0 : 2)}
        </Typography>
      </Box>
      {step >= 1 ? (
        <Slider
          value={value}
          onChange={(_event, newValue) => onChange(newValue as number)}
          min={min}
          max={max}
          step={step}
          marks={[
            { value: min, label: min.toString() },
            { value: max, label: max.toString() },
          ]}
          sx={{
            "& .MuiSlider-thumb": {
              height: 20,
              width: 20,
            },
          }}
        />
      ) : (
        <Slider
          value={value}
          onChange={(_event, newValue) => onChange(newValue as number)}
          min={min}
          max={max}
          step={step}
          sx={{
            "& .MuiSlider-thumb": {
              height: 20,
              width: 20,
            },
          }}
        />
      )}
    </Box>
  );

  return description ? <Tooltip title={description} arrow placement="top">{input}</Tooltip> : input;
};

// ============================================================================
// Form Components for Each Config Type
// ============================================================================

const SamplingForm = ({ config, onChange }: { config: SamplingConfig; onChange: (config: SamplingConfig) => void }) => {
  const handleChange = (field: keyof SamplingConfig, value: number) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SliderField
          label="Temperature"
          value={config.temperature}
          onChange={(v) => handleChange("temperature", v)}
          min={0}
          max={2}
          step={0.1}
          description={PARAM_DESCRIPTIONS.temperature}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SliderField
          label="Top P"
          value={config.top_p}
          onChange={(v) => handleChange("top_p", v)}
          min={0}
          max={1}
          step={0.05}
          description={PARAM_DESCRIPTIONS.top_p}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.top_k} arrow>
          <TextField
            fullWidth
            label="Top K"
            type="number"
            value={config.top_k}
            onChange={(e) => handleChange("top_k", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 0 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SliderField
          label="Min P"
          value={config.min_p}
          onChange={(v) => handleChange("min_p", v)}
          min={0}
          max={1}
          step={0.05}
          description={PARAM_DESCRIPTIONS.min_p}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SliderField
          label="Typical P"
          value={config.typical_p}
          onChange={(v) => handleChange("typical_p", v)}
          min={0}
          max={1}
          step={0.05}
          description={PARAM_DESCRIPTIONS.typical_p}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SliderField
          label="Repeat Penalty"
          value={config.repeat_penalty}
          onChange={(v) => handleChange("repeat_penalty", v)}
          min={0}
          max={2}
          step={0.1}
          description={PARAM_DESCRIPTIONS.repeat_penalty}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.repeat_last_n} arrow>
          <TextField
            fullWidth
            label="Repeat Last N"
            type="number"
            value={config.repeat_last_n}
            onChange={(e) => handleChange("repeat_last_n", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 0 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SliderField
          label="Frequency Penalty"
          value={config.frequency_penalty}
          onChange={(v) => handleChange("frequency_penalty", v)}
          min={0}
          max={2}
          step={0.1}
          description={PARAM_DESCRIPTIONS.frequency_penalty}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SliderField
          label="Presence Penalty"
          value={config.presence_penalty}
          onChange={(v) => handleChange("presence_penalty", v)}
          min={0}
          max={2}
          step={0.1}
          description={PARAM_DESCRIPTIONS.presence_penalty}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.seed} arrow>
          <TextField
            fullWidth
            label="Seed"
            type="number"
            value={config.seed}
            onChange={(e) => handleChange("seed", parseInt(e.target.value) || -1)}
            helperText="-1 for random"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Divider sx={{ my: 2 }} />
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle2" gutterBottom>
          Mirostat Sampling
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Mirostat Mode</InputLabel>
          <Select
            value={config.mirostat}
            onChange={(_event, value) => handleChange("mirostat", parseInt(value as string, 10))}
            label="Mirostat Mode"
          >
            <MenuItem value={0}>Disabled</MenuItem>
            <MenuItem value={1}>Mirostat</MenuItem>
            <MenuItem value={2}>Mirostat 2.0</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SliderField
          label="Mirostat Tau"
          value={config.mirostat_tau}
          onChange={(v) => handleChange("mirostat_tau", v)}
          min={0}
          max={10}
          step={0.1}
          description={PARAM_DESCRIPTIONS.mirostat_tau}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SliderField
          label="Mirostat Eta"
          value={config.mirostat_eta}
          onChange={(v) => handleChange("mirostat_eta", v)}
          min={0}
          max={1}
          step={0.01}
          description={PARAM_DESCRIPTIONS.mirostat_eta}
        />
      </Grid>
    </Grid>
  );
};

const MemoryForm = ({ config, onChange }: { config: MemoryConfig; onChange: (config: MemoryConfig) => void }) => {
  const handleChange = (field: keyof MemoryConfig, value: number | boolean | string) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.num_ctx} arrow>
          <TextField
            fullWidth
            label="Context Size"
            type="number"
            value={config.num_ctx}
            onChange={(e) => handleChange("num_ctx", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 1 } }}
            helperText="Number of tokens"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.num_batch} arrow>
          <TextField
            fullWidth
            label="Batch Size"
            type="number"
            value={config.num_batch}
            onChange={(e) => handleChange("num_batch", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 1 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.cache_ram} arrow>
          <TextField
            fullWidth
            label="Cache RAM (MB)"
            type="number"
            value={config.cache_ram}
            onChange={(e) => handleChange("cache_ram", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 0 } }}
            helperText="0 for unlimited"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Tooltip title={PARAM_DESCRIPTIONS.memory_f16} arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={config.memory_f16}
                onChange={(e) => handleChange("memory_f16", e.target.checked)}
              />
              <Typography variant="body2">Use F16 Memory</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Tooltip title={PARAM_DESCRIPTIONS.memory_lock} arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={config.memory_lock}
                onChange={(e) => handleChange("memory_lock", e.target.checked)}
              />
              <Typography variant="body2">Lock Memory</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
    </Grid>
  );
};

const GPUForm = ({ config, onChange }: { config: GPUConfig; onChange: (config: GPUConfig) => void }) => {
  const handleChange = (field: keyof GPUConfig, value: number | boolean | string) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.n_gpu_layers} arrow>
          <TextField
            fullWidth
            label="GPU Layers"
            type="number"
            value={config.n_gpu_layers}
            onChange={(e) => handleChange("n_gpu_layers", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: -1 } }}
            helperText="-1 for all layers"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.n_gpu} arrow>
          <TextField
            fullWidth
            label="Number of GPUs"
            type="number"
            value={config.n_gpu}
            onChange={(e) => handleChange("n_gpu", parseInt(e.target.value) || 1)}
            InputProps={{ inputProps: { min: 1 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.tensor_split} arrow>
          <TextField
            fullWidth
            label="Tensor Split"
            value={config.tensor_split}
            onChange={(e) => handleChange("tensor_split", e.target.value)}
            helperText="Comma-separated values (e.g., 16,8)"
            placeholder="e.g., 16,8"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.main_gpu} arrow>
          <TextField
            fullWidth
            label="Main GPU"
            type="number"
            value={config.main_gpu}
            onChange={(e) => handleChange("main_gpu", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 0 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Tooltip title={PARAM_DESCRIPTIONS.mm_lock} arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={config.mm_lock}
                onChange={(e) => handleChange("mm_lock", e.target.checked)}
              />
              <Typography variant="body2">Lock MM Tensors</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
    </Grid>
  );
};

const AdvancedForm = ({ config, onChange }: { config: AdvancedConfig; onChange: (config: AdvancedConfig) => void }) => {
  const handleChange = (field: keyof AdvancedConfig, value: number) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.rope_frequency} arrow>
          <TextField
            fullWidth
            label="RoPE Frequency"
            type="number"
            value={config.rope_frequency}
            onChange={(e) => handleChange("rope_frequency", parseFloat(e.target.value) || 10000)}
            InputProps={{ inputProps: { min: 1, step: 0.1 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.rope_scale} arrow>
          <TextField
            fullWidth
            label="RoPE Scale"
            type="number"
            value={config.rope_scale}
            onChange={(e) => handleChange("rope_scale", parseFloat(e.target.value) || 1.0)}
            InputProps={{ inputProps: { min: 0, step: 0.1 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.yarn_ext_factor} arrow>
          <TextField
            fullWidth
            label="YaRN Ext Factor"
            type="number"
            value={config.yarn_ext_factor}
            onChange={(e) => handleChange("yarn_ext_factor", parseFloat(e.target.value) || -1)}
            InputProps={{ inputProps: { min: -1, step: 0.1 } }}
            helperText="-1 for disabled"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.yarn_orig_ctx} arrow>
          <TextField
            fullWidth
            label="YaRN Original Ctx"
            type="number"
            value={config.yarn_orig_ctx}
            onChange={(e) => handleChange("yarn_orig_ctx", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 0 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.yarn_attn_factor} arrow>
          <TextField
            fullWidth
            label="YaRN Attn Factor"
            type="number"
            value={config.yarn_attn_factor}
            onChange={(e) => handleChange("yarn_attn_factor", parseFloat(e.target.value) || 1.0)}
            InputProps={{ inputProps: { min: 0, step: 0.1 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.yarn_beta_fast} arrow>
          <TextField
            fullWidth
            label="YaRN Beta Fast"
            type="number"
            value={config.yarn_beta_fast}
            onChange={(e) => handleChange("yarn_beta_fast", parseInt(e.target.value) || 32)}
            InputProps={{ inputProps: { min: 1 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.yarn_beta_slow} arrow>
          <TextField
            fullWidth
            label="YaRN Beta Slow"
            type="number"
            value={config.yarn_beta_slow}
            onChange={(e) => handleChange("yarn_beta_slow", parseInt(e.target.value) || 1)}
            InputProps={{ inputProps: { min: 1 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.num_thread} arrow>
          <TextField
            fullWidth
            label="Number of Threads"
            type="number"
            value={config.num_thread}
            onChange={(e) => handleChange("num_thread", parseInt(e.target.value) || 8)}
            InputProps={{ inputProps: { min: 1 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.num_predict} arrow>
          <TextField
            fullWidth
            label="Max Predict Tokens"
            type="number"
            value={config.num_predict}
            onChange={(e) => handleChange("num_predict", parseInt(e.target.value) || -1)}
            InputProps={{ inputProps: { min: -1 } }}
            helperText="-1 for unlimited"
            size="small"
          />
        </Tooltip>
      </Grid>
    </Grid>
  );
};

const LoRAForm = ({ config, onChange }: { config: LoRAConfig; onChange: (config: LoRAConfig) => void }) => {
  const handleChange = (field: keyof LoRAConfig, value: number | string) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.lora_adapter} arrow>
          <TextField
            fullWidth
            label="LoRA Adapter Path"
            value={config.lora_adapter}
            onChange={(e) => handleChange("lora_adapter", e.target.value)}
            placeholder="/path/to/lora/adapter.bin"
            helperText="Path to LoRA adapter file"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.lora_base} arrow>
          <TextField
            fullWidth
            label="LoRA Base Model"
            value={config.lora_base}
            onChange={(e) => handleChange("lora_base", e.target.value)}
            placeholder="/path/to/base/model"
            helperText="Base model path for LoRA adapter"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SliderField
          label="LoRA Scale"
          value={config.lora_scale}
          onChange={(v) => handleChange("lora_scale", v)}
          min={0}
          max={1}
          step={0.1}
          description={PARAM_DESCRIPTIONS.lora_scale}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.control_vectors} arrow>
          <TextField
            fullWidth
            label="Control Vectors"
            value={config.control_vectors}
            onChange={(e) => handleChange("control_vectors", e.target.value)}
            placeholder="/path/to/vector1.bin,/path/to/vector2.bin"
            helperText="Comma-separated paths to control vector files"
            size="small"
            multiline
            rows={2}
          />
        </Tooltip>
      </Grid>
    </Grid>
  );
};

const MultimodalForm = ({ config, onChange }: { config: MultimodalConfig; onChange: (config: MultimodalConfig) => void }) => {
  const handleChange = (field: keyof MultimodalConfig, value: boolean | string) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.image_data} arrow>
          <TextField
            fullWidth
            label="Image Data"
            value={config.image_data}
            onChange={(e) => handleChange("image_data", e.target.value)}
            placeholder="Image data or path"
            helperText="Image data for multimodal input"
            size="small"
            multiline
            rows={3}
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Tooltip title={PARAM_DESCRIPTIONS.clip_vision_cache} arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={config.clip_vision_cache}
                onChange={(e) => handleChange("clip_vision_cache", e.target.checked)}
              />
              <Typography variant="body2">Cache CLIP Vision Model</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.mmproj} arrow>
          <TextField
            fullWidth
            label="MMProj Model Path"
            value={config.mmproj}
            onChange={(e) => handleChange("mmproj", e.target.value)}
            placeholder="/path/to/mmproj.bin"
            helperText="Path to multimodal projection model"
            size="small"
          />
        </Tooltip>
      </Grid>
    </Grid>
  );
};

// ============================================================================
// Main Dialog Component
// ============================================================================

export function ModelConfigDialog({
  open,
  modelId: _modelId, // eslint-disable-line @typescript-eslint/no-unused-vars
  configType,
  config,
  onClose,
  onSave,
}: ModelConfigDialogProps) {
  // Ref to track initialization and avoid unnecessary updates
  const initializedRef = useRef(false);

  // Default configurations for each type (memoized to avoid re-creation)
  const defaultConfigs: Record<
    ConfigType,
    SamplingConfig | MemoryConfig | GPUConfig | AdvancedConfig | LoRAConfig | MultimodalConfig
  > = useMemo(
    () => ({
      sampling: DEFAULT_SAMPLING,
      memory: DEFAULT_MEMORY,
      gpu: DEFAULT_GPU,
      advanced: DEFAULT_ADVANCED,
      lora: DEFAULT_LORA,
      multimodal: DEFAULT_MULTIMODAL,
    }),
    [],
  );

  // State for local config changes
  const [localConfig, setLocalConfig] = useState<
    SamplingConfig | MemoryConfig | GPUConfig | AdvancedConfig | LoRAConfig | MultimodalConfig | null
  >(null);

  // Initialize local config when dialog opens or config changes
  useEffect(() => {
    if (open) {
      // Sync config when dialog opens - this is necessary to load existing config values
      // or defaults when user clicks "Configure" button
      // We intentionally call setState here to sync with props (React docs allow this pattern
      // for syncing derived state when props change)
      setLocalConfig(config || defaultConfigs[configType]);
      initializedRef.current = true;
    } else {
      initializedRef.current = false;
    }
  }, [open, config, configType, defaultConfigs]);

  // Validation is always true for this component
  const isValid = true;

  // Get title for dialog based on config type
  const getDialogTitle = (): string => {
    const titles: Record<ConfigType, string> = {
      sampling: "Sampling Configuration",
      memory: "Memory Configuration",
      gpu: "GPU Configuration",
      advanced: "Advanced Configuration",
      lora: "LoRA Configuration",
      multimodal: "Multimodal Configuration",
    };
    return titles[configType];
  };

  // Handle form change
  const handleConfigChange = (
    newConfig: SamplingConfig | MemoryConfig | GPUConfig | AdvancedConfig | LoRAConfig | MultimodalConfig
  ) => {
    setLocalConfig(newConfig);
  };

  // Handle save
  const handleSave = () => {
    if (localConfig) {
      onSave(localConfig);
      onClose();
    }
  };

  // Render appropriate form based on config type
  const renderForm = () => {
    switch (configType) {
      case "sampling":
        return <SamplingForm config={localConfig as SamplingConfig} onChange={handleConfigChange} />;
      case "memory":
        return <MemoryForm config={localConfig as MemoryConfig} onChange={handleConfigChange} />;
      case "gpu":
        return <GPUForm config={localConfig as GPUConfig} onChange={handleConfigChange} />;
      case "advanced":
        return <AdvancedForm config={localConfig as AdvancedConfig} onChange={handleConfigChange} />;
      case "lora":
        return <LoRAForm config={localConfig as LoRAConfig} onChange={handleConfigChange} />;
      case "multimodal":
        return <MultimodalForm config={localConfig as MultimodalConfig} onChange={handleConfigChange} />;
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle variant="h6">{getDialogTitle()}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mt: 1 }}>
          {renderForm()}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={!isValid}>
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ModelConfigDialog;
