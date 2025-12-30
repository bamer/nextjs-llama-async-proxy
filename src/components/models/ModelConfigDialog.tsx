"use client";

/* eslint-disable react-hooks/set-state-in-effect */
// We intentionally call setState in useEffect to sync local state with props when dialog opens.
// This is a valid React pattern for initializing component state from props.

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
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
  flash_attn: "auto" | "on" | "off";
}

export interface MemoryConfig {
  ctx_size: number;
  num_batch: number;
  cache_ram: number;
  memory_f16: boolean;
  memory_lock: boolean;
  mmap: boolean;
  mlock: boolean;
  numa: string;
  defrag_thold: number;
  cache_type_k: string;
  cache_type_v: string;
}

export interface GPUConfig {
  n_gpu_layers: number;
  n_gpu: number;
  tensor_split: string;
  main_gpu: number;
  mm_lock: boolean;
  list_devices: boolean;
  kv_offload: boolean;
  repack: boolean;
  no_host: boolean;
  split_mode: string;
  device: string;
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
  swa_full: boolean;
  override_tensor: string;
  cpu_moe: boolean;
  n_cpu_moe: number;
  kv_unified: boolean;
  context_shift: boolean;
  rpc: string;
  offline: boolean;
  override_kv: string;
  op_offload: boolean;
  check_tensors: boolean;
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
  mmproj_auto: boolean;
  mmproj_offload: boolean;
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
  flash_attn: "auto",
};

const DEFAULT_MEMORY: MemoryConfig = {
  ctx_size: 2048,
  num_batch: 512,
  cache_ram: 0,
  memory_f16: true,
  memory_lock: false,
  mmap: false,
  mlock: false,
  numa: "",
  defrag_thold: -1,
  cache_type_k: "f16",
  cache_type_v: "f16",
};

const DEFAULT_GPU: GPUConfig = {
  n_gpu_layers: -1,
  n_gpu: 1,
  tensor_split: "",
  main_gpu: 0,
  mm_lock: false,
  list_devices: false,
  kv_offload: false,
  repack: false,
  no_host: false,
  split_mode: "layer",
  device: "",
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
  swa_full: false,
  override_tensor: "",
  cpu_moe: false,
  n_cpu_moe: 0,
  kv_unified: false,
  context_shift: false,
  rpc: "",
  offline: false,
  override_kv: "",
  op_offload: false,
  check_tensors: false,
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
  mmproj_auto: false,
  mmproj_offload: false,
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
  ctx_size: "Context window size. Number of tokens the model can consider.",
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
  flash_attn: "Flash attention mode. Auto detects support, On/Off forces mode.",
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

const SliderField = memo(function SliderField({ label, value, onChange, min, max, step, description }: SliderFieldProps) {
  const handleSliderChange = useCallback(
    (_event: Event | React.SyntheticEvent<Element, Event>, newValue: number | number[]) => {
      onChange(newValue as number);
    },
    [onChange],
  );

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
          onChange={handleSliderChange}
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
          onChange={handleSliderChange}
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
});

// ============================================================================
// Form Components for Each Config Type
// ============================================================================

const SamplingForm = memo(function SamplingForm({ config, onChange }: { config: SamplingConfig; onChange: (config: SamplingConfig) => void }) {
  const handleChange = useCallback(
    (field: keyof SamplingConfig, value: number | "auto" | "on" | "off") => {
      onChange({ ...config, [field]: value });
    },
    [config, onChange],
  );

  const handleTemperatureChange = useCallback((v: number) => handleChange("temperature", v), [handleChange]);
  const handleTopPChange = useCallback((v: number) => handleChange("top_p", v), [handleChange]);
  const handleTopKChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("top_k", parseInt(e.target.value) || 0), [handleChange]);
  const handleMinPChange = useCallback((v: number) => handleChange("min_p", v), [handleChange]);
  const handleTypicalPChange = useCallback((v: number) => handleChange("typical_p", v), [handleChange]);
  const handleRepeatPenaltyChange = useCallback((v: number) => handleChange("repeat_penalty", v), [handleChange]);
  const handleRepeatLastNChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("repeat_last_n", parseInt(e.target.value) || 0), [handleChange]);
  const handleFrequencyPenaltyChange = useCallback((v: number) => handleChange("frequency_penalty", v), [handleChange]);
  const handlePresencePenaltyChange = useCallback((v: number) => handleChange("presence_penalty", v), [handleChange]);
  const handleSeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("seed", parseInt(e.target.value) || -1), [handleChange]);
  const handleMirostatChange = useCallback((_event: Event | React.SyntheticEvent<Element, Event>, value: string | unknown) => handleChange("mirostat", parseInt(value as string, 10)), [handleChange]);
  const handleMirostatTauChange = useCallback((v: number) => handleChange("mirostat_tau", v), [handleChange]);
  const handleMirostatEtaChange = useCallback((v: number) => handleChange("mirostat_eta", v), [handleChange]);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SliderField
          label="Temperature"
          value={config.temperature}
          onChange={handleTemperatureChange}
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
          onChange={handleTopPChange}
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
            onChange={handleTopKChange}
            InputProps={{ inputProps: { min: 0 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SliderField
          label="Min P"
          value={config.min_p}
          onChange={handleMinPChange}
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
          onChange={handleTypicalPChange}
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
          onChange={handleRepeatPenaltyChange}
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
            onChange={handleRepeatLastNChange}
            InputProps={{ inputProps: { min: 0 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SliderField
          label="Frequency Penalty"
          value={config.frequency_penalty}
          onChange={handleFrequencyPenaltyChange}
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
          onChange={handlePresencePenaltyChange}
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
            onChange={handleSeedChange}
            helperText="-1 for random"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.flash_attn} arrow>
          <FormControl fullWidth size="small">
            <InputLabel>flash_attn</InputLabel>
            <Select
              value={config.flash_attn}
              onChange={(_event, value) => handleChange("flash_attn", value as "auto" | "on" | "off")}
              label="flash_attn"
            >
              <MenuItem value="auto">auto</MenuItem>
              <MenuItem value="on">on</MenuItem>
              <MenuItem value="off">off</MenuItem>
            </Select>
          </FormControl>
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
            onChange={handleMirostatChange}
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
          onChange={handleMirostatTauChange}
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
          onChange={handleMirostatEtaChange}
          min={0}
          max={1}
          step={0.01}
          description={PARAM_DESCRIPTIONS.mirostat_eta}
        />
      </Grid>
    </Grid>
  );
});

const MemoryForm = memo(function MemoryForm({ config, onChange }: { config: MemoryConfig; onChange: (config: MemoryConfig) => void }) {
  const handleChange = useCallback(
    (field: keyof MemoryConfig, value: number | boolean | string) => {
      onChange({ ...config, [field]: value });
    },
    [config, onChange],
  );

  const handleCtxSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("ctx_size", parseInt(e.target.value) || 0), [handleChange]);
  const handleNumBatchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("num_batch", parseInt(e.target.value) || 0), [handleChange]);
  const handleCacheRamChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("cache_ram", parseInt(e.target.value) || 0), [handleChange]);
  const handleMemoryF16Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("memory_f16", e.target.checked), [handleChange]);
  const handleMemoryLockChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("memory_lock", e.target.checked), [handleChange]);
  const handleMmapChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("mmap", e.target.checked), [handleChange]);
  const handleMlockChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("mlock", e.target.checked), [handleChange]);
  const handleNumaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("numa", e.target.value), [handleChange]);
  const handleDefragTholdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("defrag_thold", parseFloat(e.target.value) || -1), [handleChange]);
  const handleCacheTypeKChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("cache_type_k", e.target.value), [handleChange]);
  const handleCacheTypeVChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("cache_type_v", e.target.value), [handleChange]);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.ctx_size} arrow>
          <TextField
            fullWidth
            label="ctx_size"
            type="number"
            value={config.ctx_size}
            onChange={handleCtxSizeChange}
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
            onChange={handleNumBatchChange}
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
            onChange={handleCacheRamChange}
            InputProps={{ inputProps: { min: 0 } }}
            helperText="0 for unlimited MB"
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
                onChange={handleMemoryF16Change}
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
                onChange={handleMemoryLockChange}
              />
              <Typography variant="body2">Lock Memory</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Tooltip title="Memory map model file" arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={config.mmap}
                onChange={handleMmapChange}
              />
              <Typography variant="body2">mmap</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Tooltip title="Lock memory in RAM" arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={config.mlock}
                onChange={handleMlockChange}
              />
              <Typography variant="body2">mlock</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="NUMA policy (e.g., distribute)" arrow>
          <TextField
            fullWidth
            label="numa"
            value={config.numa}
            onChange={handleNumaChange}
            placeholder="distribute"
            helperText="Empty for default"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Defragmentation threshold" arrow>
          <TextField
            fullWidth
            label="defrag_thold"
            type="number"
            value={config.defrag_thold}
            onChange={handleDefragTholdChange}
            InputProps={{ inputProps: { min: -1, step: 0.1 } }}
            helperText="-1 for disabled"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="KV cache type for K" arrow>
          <TextField
            fullWidth
            label="cache_type_k"
            value={config.cache_type_k}
            onChange={handleCacheTypeKChange}
            placeholder="f16"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="KV cache type for V" arrow>
          <TextField
            fullWidth
            label="cache_type_v"
            value={config.cache_type_v}
            onChange={handleCacheTypeVChange}
            placeholder="f16"
            size="small"
          />
        </Tooltip>
      </Grid>
    </Grid>
  );
});

const GPUForm = memo(function GPUForm({ config, onChange }: { config: GPUConfig; onChange: (config: GPUConfig) => void }) {
  const handleChange = useCallback(
    (field: keyof GPUConfig, value: number | boolean | string) => {
      onChange({ ...config, [field]: value });
    },
    [config, onChange],
  );

  const handleNpuLayersChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("n_gpu_layers", parseInt(e.target.value) || 0), [handleChange]);
  const handleNpuChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("n_gpu", parseInt(e.target.value) || 1), [handleChange]);
  const handleTensorSplitChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("tensor_split", e.target.value), [handleChange]);
  const handleMainGpuChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("main_gpu", parseInt(e.target.value) || 0), [handleChange]);
  const handleMmLockChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("mm_lock", e.target.checked), [handleChange]);
  const handleListDevicesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("list_devices", e.target.checked), [handleChange]);
  const handleKvOffloadChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("kv_offload", e.target.checked), [handleChange]);
  const handleRepackChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("repack", e.target.checked), [handleChange]);
  const handleNoHostChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("no_host", e.target.checked), [handleChange]);
  const handleSplitModeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("split_mode", e.target.value), [handleChange]);
  const handleDeviceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("device", e.target.value), [handleChange]);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.n_gpu_layers} arrow>
          <TextField
            fullWidth
            label="GPU Layers"
            type="number"
            value={config.n_gpu_layers}
            onChange={handleNpuLayersChange}
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
            onChange={handleNpuChange}
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
            onChange={handleTensorSplitChange}
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
            onChange={handleMainGpuChange}
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
                onChange={handleMmLockChange}
              />
              <Typography variant="body2">Lock MM Tensors</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Tooltip title="List available devices" arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={config.list_devices}
                onChange={handleListDevicesChange}
              />
              <Typography variant="body2">list_devices</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Tooltip title="Offload KV cache" arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={config.kv_offload}
                onChange={handleKvOffloadChange}
              />
              <Typography variant="body2">kv_offload</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Tooltip title="Repack tensors" arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={config.repack}
                onChange={handleRepackChange}
              />
              <Typography variant="body2">repack</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Tooltip title="No host offload" arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={config.no_host}
                onChange={handleNoHostChange}
              />
              <Typography variant="body2">no_host</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Split mode (layer, row)" arrow>
          <TextField
            fullWidth
            label="split_mode"
            value={config.split_mode}
            onChange={handleSplitModeChange}
            placeholder="layer"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Device to use (e.g., cuda:0)" arrow>
          <TextField
            fullWidth
            label="device"
            value={config.device}
            onChange={handleDeviceChange}
            placeholder="cuda:0"
            size="small"
          />
        </Tooltip>
      </Grid>
    </Grid>
  );
});

const AdvancedForm = memo(function AdvancedForm({ config, onChange }: { config: AdvancedConfig; onChange: (config: AdvancedConfig) => void }) {
  const handleChange = useCallback(
    (field: keyof AdvancedConfig, value: number | boolean | string) => {
      onChange({ ...config, [field]: value });
    },
    [config, onChange],
  );

  const handleRopeFrequencyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("rope_frequency", parseFloat(e.target.value) || 10000), [handleChange]);
  const handleRopeScaleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("rope_scale", parseFloat(e.target.value) || 1.0), [handleChange]);
  const handleYarnExtFactorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("yarn_ext_factor", parseFloat(e.target.value) || -1), [handleChange]);
  const handleYarnOrigCtxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("yarn_orig_ctx", parseInt(e.target.value) || 0), [handleChange]);
  const handleYarnAttnFactorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("yarn_attn_factor", parseFloat(e.target.value) || 1.0), [handleChange]);
  const handleYarnBetaFastChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("yarn_beta_fast", parseInt(e.target.value) || 32), [handleChange]);
  const handleYarnBetaSlowChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("yarn_beta_slow", parseInt(e.target.value) || 1), [handleChange]);
  const handleNumThreadChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("num_thread", parseInt(e.target.value) || 8), [handleChange]);
  const handleNumPredictChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("num_predict", parseInt(e.target.value) || -1), [handleChange]);
  const handleSwaFullChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("swa_full", e.target.checked), [handleChange]);
  const handleOverrideTensorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("override_tensor", e.target.value), [handleChange]);
  const handleCpuMoeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("cpu_moe", e.target.checked), [handleChange]);
  const handleNCpuMoeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("n_cpu_moe", parseInt(e.target.value) || 0), [handleChange]);
  const handleKvUnifiedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("kv_unified", e.target.checked), [handleChange]);
  const handleContextShiftChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("context_shift", e.target.checked), [handleChange]);
  const handleRpcChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("rpc", e.target.value), [handleChange]);
  const handleOfflineChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("offline", e.target.checked), [handleChange]);
  const handleOverrideKvChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("override_kv", e.target.value), [handleChange]);
  const handleOpOffloadChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("op_offload", e.target.checked), [handleChange]);
  const handleCheckTensorsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("check_tensors", e.target.checked), [handleChange]);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.rope_frequency} arrow>
          <TextField
            fullWidth
            label="RoPE Frequency"
            type="number"
            value={config.rope_frequency}
            onChange={handleRopeFrequencyChange}
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
            onChange={handleRopeScaleChange}
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
            onChange={handleYarnExtFactorChange}
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
            onChange={handleYarnOrigCtxChange}
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
            onChange={handleYarnAttnFactorChange}
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
            onChange={handleYarnBetaFastChange}
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
            onChange={handleYarnBetaSlowChange}
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
            onChange={handleNumThreadChange}
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
            onChange={handleNumPredictChange}
            InputProps={{ inputProps: { min: -1 } }}
            helperText="-1 for unlimited"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Divider sx={{ my: 2 }} />
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Tooltip title="Sliding window attention full" arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={config.swa_full}
                onChange={handleSwaFullChange}
              />
              <Typography variant="body2">swa_full</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Override tensor format" arrow>
          <TextField
            fullWidth
            label="override_tensor"
            value={config.override_tensor}
            onChange={handleOverrideTensorChange}
            placeholder="f16"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Tooltip title="CPU MoE layers" arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={config.cpu_moe}
                onChange={handleCpuMoeChange}
              />
              <Typography variant="body2">cpu_moe</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Number of CPU MoE layers" arrow>
          <TextField
            fullWidth
            label="n_cpu_moe"
            type="number"
            value={config.n_cpu_moe}
            onChange={handleNCpuMoeChange}
            InputProps={{ inputProps: { min: 0 } }}
            helperText="Number of MoE expert layers"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Tooltip title="Unified KV cache" arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={config.kv_unified}
                onChange={handleKvUnifiedChange}
              />
              <Typography variant="body2">kv_unified</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Tooltip title="Context shift for long contexts" arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={config.context_shift}
                onChange={handleContextShiftChange}
              />
              <Typography variant="body2">context_shift</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="RPC server address" arrow>
          <TextField
            fullWidth
            label="rpc"
            value={config.rpc}
            onChange={handleRpcChange}
            placeholder="localhost:50051"
            helperText="RPC server for remote execution"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Tooltip title="Offline mode" arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={config.offline}
                onChange={handleOfflineChange}
              />
              <Typography variant="body2">offline</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Override KV cache settings" arrow>
          <TextField
            fullWidth
            label="override_kv"
            value={config.override_kv}
            onChange={handleOverrideKvChange}
            placeholder="f16"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Tooltip title="Operator offload" arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={config.op_offload}
                onChange={handleOpOffloadChange}
              />
              <Typography variant="body2">op_offload</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Tooltip title="Check tensor data" arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={config.check_tensors}
                onChange={handleCheckTensorsChange}
              />
              <Typography variant="body2">check_tensors</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
    </Grid>
  );
});

const LoRAForm = memo(function LoRAForm({ config, onChange }: { config: LoRAConfig; onChange: (config: LoRAConfig) => void }) {
  const handleChange = useCallback(
    (field: keyof LoRAConfig, value: number | string) => {
      onChange({ ...config, [field]: value });
    },
    [config, onChange],
  );

  const handleLoraAdapterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("lora_adapter", e.target.value), [handleChange]);
  const handleLoraBaseChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("lora_base", e.target.value), [handleChange]);
  const handleLoraScaleChange = useCallback((v: number) => handleChange("lora_scale", v), [handleChange]);
  const handleControlVectorsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("control_vectors", e.target.value), [handleChange]);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.lora_adapter} arrow>
          <TextField
            fullWidth
            label="LoRA Adapter Path"
            value={config.lora_adapter}
            onChange={handleLoraAdapterChange}
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
            onChange={handleLoraBaseChange}
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
          onChange={handleLoraScaleChange}
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
            onChange={handleControlVectorsChange}
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
});

const MultimodalForm = memo(function MultimodalForm({ config, onChange }: { config: MultimodalConfig; onChange: (config: MultimodalConfig) => void }) {
  const handleChange = useCallback(
    (field: keyof MultimodalConfig, value: boolean | string) => {
      onChange({ ...config, [field]: value });
    },
    [config, onChange],
  );

  const handleImageDataChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("image_data", e.target.value), [handleChange]);
  const handleClipVisionCacheChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("clip_vision_cache", e.target.checked), [handleChange]);
  const handleMmprojChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("mmproj", e.target.value), [handleChange]);
  const handleMmprojAutoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("mmproj_auto", e.target.checked), [handleChange]);
  const handleMmprojOffloadChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("mmproj_offload", e.target.checked), [handleChange]);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.image_data} arrow>
          <TextField
            fullWidth
            label="Image Data"
            value={config.image_data}
            onChange={handleImageDataChange}
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
                onChange={handleClipVisionCacheChange}
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
            onChange={handleMmprojChange}
            placeholder="/path/to/mmproj.bin"
            helperText="Path to multimodal projection model"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Tooltip title="Auto-detect mmproj model" arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={config.mmproj_auto}
                onChange={handleMmprojAutoChange}
              />
              <Typography variant="body2">mmproj_auto</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Tooltip title="Offload mmproj to GPU" arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={config.mmproj_offload}
                onChange={handleMmprojOffloadChange}
              />
              <Typography variant="body2">mmproj_offload</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>
    </Grid>
  );
});

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

  // Get title for dialog based on config type (memoized)
  const getDialogTitle = useCallback((): string => {
    const titles: Record<ConfigType, string> = {
      sampling: "Sampling Configuration",
      memory: "Memory Configuration",
      gpu: "GPU Configuration",
      advanced: "Advanced Configuration",
      lora: "LoRA Configuration",
      multimodal: "Multimodal Configuration",
    };
    return titles[configType];
  }, [configType]);

  // Handle form change (memoized)
  const handleConfigChange = useCallback(
    (
      newConfig: SamplingConfig | MemoryConfig | GPUConfig | AdvancedConfig | LoRAConfig | MultimodalConfig
    ) => {
      setLocalConfig(newConfig);
    },
    [],
  );

  // Handle save (memoized)
  const handleSave = useCallback(() => {
    if (localConfig) {
      onSave(localConfig);
      onClose();
    }
  }, [localConfig, onSave, onClose]);

  // Render appropriate form based on config type (memoized)
  const renderForm = useCallback(() => {
    if (!localConfig) return null;

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
  }, [configType, localConfig, handleConfigChange]);

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
