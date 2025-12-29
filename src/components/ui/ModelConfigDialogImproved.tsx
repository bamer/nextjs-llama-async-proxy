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
  Tooltip,
  InputAdornment,
  IconButton,
  Alert,
  Divider,
  Stack,
  useMediaQuery,
  useTheme as useMuiTheme,
  Fade,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Tune as TuneIcon,
  Keyboard as KeyboardIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Memory as GpuIcon,
  Build as BuildIcon,
  Layers as LayersIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";

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

// Validation rule interface
interface ValidationRule {
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  unit?: string;
}

// Field definitions with enhanced properties
const configFields: Record<
  ConfigType,
  Array<{
    name: string;
    label: string;
    type: "text" | "number" | "select" | "boolean" | "slider";
    options?: string[];
    defaultValue?: any;
    size?: { xs?: number; sm?: number; md?: number };
    group?: string;
    description?: string;
    validation?: ValidationRule;
  }>
> = {
  sampling: [
    // Core Sampling Parameters
    {
      name: "temperature",
      label: "Temperature",
      type: "slider",
      defaultValue: 0.7,
      size: { xs: 12, sm: 6, md: 4 },
      group: "Core Sampling",
      description: "Controls randomness. Lower = more deterministic, Higher = more creative",
      validation: { min: 0, max: 2, step: 0.01, unit: "" },
    },
    {
      name: "top_k",
      label: "Top K",
      type: "slider",
      defaultValue: 40,
      size: { xs: 12, sm: 6, md: 4 },
      group: "Core Sampling",
      description: "Limit next token selection to top K probabilities",
      validation: { min: 0, max: 100, step: 1, unit: "" },
    },
    {
      name: "top_p",
      label: "Top P (Nucleus)",
      type: "slider",
      defaultValue: 0.9,
      size: { xs: 12, sm: 6, md: 4 },
      group: "Core Sampling",
      description: "Cumulative probability threshold for token selection",
      validation: { min: 0, max: 1, step: 0.01, unit: "" },
    },
    {
      name: "min_p",
      label: "Min P",
      type: "slider",
      defaultValue: 0.05,
      size: { xs: 12, sm: 6, md: 4 },
      group: "Core Sampling",
      description: "Minimum probability threshold for token selection",
      validation: { min: 0, max: 1, step: 0.01, unit: "" },
    },
    {
      name: "repeat_last_n",
      label: "Repeat Last N",
      type: "number",
      defaultValue: 64,
      size: { xs: 12, sm: 6, md: 4 },
      group: "Repetition Control",
      description: "Number of last tokens to consider for repetition penalty",
      validation: { min: 0, max: 2048, step: 1, unit: "tokens" },
    },
    {
      name: "repeat_penalty",
      label: "Repeat Penalty",
      type: "slider",
      defaultValue: 1,
      size: { xs: 12, sm: 6, md: 4 },
      group: "Repetition Control",
      description: "Penalty for repeating tokens (1.0 = no penalty)",
      validation: { min: 1, max: 2, step: 0.01, unit: "x" },
    },
    {
      name: "presence_penalty",
      label: "Presence Penalty",
      type: "slider",
      defaultValue: 0,
      size: { xs: 12, sm: 6, md: 4 },
      group: "Repetition Control",
      description: "Penalty for new topics appearing",
      validation: { min: -2, max: 2, step: 0.1, unit: "" },
    },
    {
      name: "frequency_penalty",
      label: "Frequency Penalty",
      type: "slider",
      defaultValue: 0,
      size: { xs: 12, sm: 6, md: 4 },
      group: "Repetition Control",
      description: "Penalty proportional to token frequency",
      validation: { min: -2, max: 2, step: 0.1, unit: "" },
    },
    {
      name: "dry_multiplier",
      label: "DRY Multiplier",
      type: "slider",
      defaultValue: 0,
      size: { xs: 12, sm: 6, md: 4 },
      group: "DRY Parameters",
      description: "Multiplier for DRY (Dampen Repetition) penalty",
      validation: { min: 0, max: 5, step: 0.1, unit: "" },
    },
    {
      name: "dry_base",
      label: "DRY Base",
      type: "slider",
      defaultValue: 1.75,
      size: { xs: 12, sm: 6, md: 4 },
      group: "DRY Parameters",
      description: "Base value for DRY calculation",
      validation: { min: 1, max: 3, step: 0.01, unit: "" },
    },
    {
      name: "mirostat",
      label: "Mirostat Mode",
      type: "select",
      options: ["0", "1", "2"],
      defaultValue: "0",
      size: { xs: 12, sm: 6, md: 4 },
      group: "Mirostat",
      description: "Mirostat algorithm: 0=disabled, 1=Mirostat, 2=Mirostat 2.0",
    },
    {
      name: "mirostat_lr",
      label: "Mirostat Learning Rate",
      type: "slider",
      defaultValue: 0.1,
      size: { xs: 12, sm: 6, md: 4 },
      group: "Mirostat",
      description: "Learning rate for Mirostat algorithm",
      validation: { min: 0.001, max: 1, step: 0.01, unit: "" },
    },
    {
      name: "mirostat_ent",
      label: "Mirostat Entropy",
      type: "slider",
      defaultValue: 5,
      size: { xs: 12, sm: 6, md: 4 },
      group: "Mirostat",
      description: "Target entropy for Mirostat algorithm",
      validation: { min: 0, max: 20, step: 0.1, unit: "" },
    },
    {
      name: "seed",
      label: "Random Seed",
      type: "number",
      defaultValue: -1,
      size: { xs: 12, sm: 6, md: 4 },
      group: "Output Control",
      description: "Random seed for generation (-1 = random)",
      validation: { min: -1, max: 2147483647, step: 1, unit: "" },
    },
    {
      name: "ignore_eos",
      label: "Ignore EOS",
      type: "boolean",
      defaultValue: false,
      size: { xs: 12, sm: 6, md: 4 },
      group: "Output Control",
      description: "Ignore end-of-sequence token",
    },
    {
      name: "escape",
      label: "Escape Special Characters",
      type: "boolean",
      defaultValue: false,
      size: { xs: 12, sm: 6, md: 4 },
      group: "Output Control",
      description: "Escape special characters in output",
    },
  ],
  memory: [
    {
      name: "cache_ram",
      label: "Cache RAM",
      type: "number",
      defaultValue: 0,
      size: { xs: 12, sm: 6 },
      group: "Cache Settings",
      description: "RAM to use for cache (0 = auto)",
      validation: { min: 0, max: 128, step: 1, unit: "GB" },
    },
    {
      name: "mmap",
      label: "Memory Mapping (MMap)",
      type: "select",
      options: ["0", "1"],
      defaultValue: "1",
      size: { xs: 12, sm: 6 },
      group: "Memory Management",
      description: "Use memory-mapped files for model weights",
    },
    {
      name: "mlock",
      label: "Lock Memory (MLock)",
      type: "select",
      options: ["0", "1"],
      defaultValue: "0",
      size: { xs: 12, sm: 6 },
      group: "Memory Management",
      description: "Lock model in RAM to prevent swapping",
    },
    {
      name: "defrag_thold",
      label: "Defrag Threshold",
      type: "number",
      defaultValue: -1,
      size: { xs: 12, sm: 6 },
      group: "Performance",
      description: "Memory defragmentation threshold",
      validation: { min: -1, max: 100, step: 1, unit: "%" },
    },
  ],
  gpu: [
    {
      name: "gpu_layers",
      label: "GPU Layers",
      type: "slider",
      defaultValue: -1,
      size: { xs: 12, sm: 6 },
      group: "GPU Settings",
      description: "Number of layers to offload to GPU (-1 = all)",
      validation: { min: -1, max: 200, step: 1, unit: "" },
    },
    {
      name: "split_mode",
      label: "Split Mode",
      type: "select",
      options: ["", "layer", "row"],
      defaultValue: "",
      size: { xs: 12, sm: 6 },
      group: "Multi-GPU",
      description: "Model splitting mode for multiple GPUs",
    },
    {
      name: "main_gpu",
      label: "Main GPU",
      type: "number",
      defaultValue: 0,
      size: { xs: 12, sm: 6 },
      group: "Multi-GPU",
      description: "Main GPU ID for operations",
      validation: { min: 0, max: 16, step: 1, unit: "" },
    },
    {
      name: "kv_offload",
      label: "KV Cache Offload",
      type: "select",
      options: ["0", "1"],
      defaultValue: "0",
      size: { xs: 12, sm: 6 },
      group: "Performance",
      description: "Offload KV cache to GPU",
    },
  ],
  advanced: [
    {
      name: "context_shift",
      label: "Context Shift",
      type: "select",
      options: ["0", "1"],
      defaultValue: "0",
      size: { xs: 12, sm: 6 },
      group: "Model Behavior",
      description: "Enable context window shifting",
    },
    {
      name: "flash_attn",
      label: "Flash Attention",
      type: "select",
      options: ["", "0", "1"],
      defaultValue: "",
      size: { xs: 12, sm: 6 },
      group: "Performance",
      description: "Use flash attention (requires GPU support)",
    },
    {
      name: "check_tensors",
      label: "Check Tensors",
      type: "select",
      options: ["0", "1"],
      defaultValue: "0",
      size: { xs: 12, sm: 6 },
      group: "Debugging",
      description: "Verify tensor data integrity",
    },
    {
      name: "sleep_idle_seconds",
      label: "Idle Sleep Time",
      type: "number",
      defaultValue: 0,
      size: { xs: 12, sm: 6 },
      group: "Power Management",
      description: "Seconds to sleep when idle (0 = disabled)",
      validation: { min: 0, max: 3600, step: 1, unit: "s" },
    },
  ],
  lora: [
    {
      name: "lora",
      label: "LoRA Adapter",
      type: "text",
      defaultValue: "",
      size: { xs: 12 },
      group: "LoRA Configuration",
      description: "Path to LoRA adapter file",
    },
    {
      name: "draft_max",
      label: "Draft Max Tokens",
      type: "number",
      defaultValue: 16,
      size: { xs: 12, sm: 6 },
      group: "Speculative Decoding",
      description: "Maximum tokens to draft in speculative decoding",
      validation: { min: 1, max: 64, step: 1, unit: "tokens" },
    },
    {
      name: "draft_min",
      label: "Draft Min Tokens",
      type: "number",
      defaultValue: 5,
      size: { xs: 12, sm: 6 },
      group: "Speculative Decoding",
      description: "Minimum tokens to draft",
      validation: { min: 1, max: 64, step: 1, unit: "tokens" },
    },
  ],
  multimodal: [
    {
      name: "mmproj",
      label: "MMPROJ Model",
      type: "text",
      defaultValue: "",
      size: { xs: 12 },
      group: "Multimodal Projection",
      description: "Path to multimodal projection model",
    },
    {
      name: "image_max_tokens",
      label: "Max Image Tokens",
      type: "number",
      defaultValue: 0,
      size: { xs: 12, sm: 6 },
      group: "Token Control",
      description: "Maximum tokens for image encoding (0 = auto)",
      validation: { min: 0, max: 4096, step: 1, unit: "tokens" },
    },
    {
      name: "mmproj_auto",
      label: "Auto-detect MMPROJ",
      type: "select",
      options: ["0", "1"],
      defaultValue: "0",
      size: { xs: 12, sm: 6 },
      group: "Auto-detection",
      description: "Automatically detect and load multimodal projection",
    },
  ],
};

// Validation errors state
interface ValidationErrors {
  [fieldName: string]: string;
}

export default function ModelConfigDialog({
  open,
  modelId,
  configType,
  config,
  onClose,
  onSave,
}: ModelConfigDialogProps) {
  const { isDark } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const [editedConfig, setEditedConfig] = useState<any>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [useSlider, setUseSlider] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<string | false>("Core Sampling");
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Initialize config when dialog opens
  useEffect(() => {
    if (open && configType && config) {
      setEditedConfig({ ...config });
      setHasChanges(false);
      setErrors({});
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
      setErrors({});
    }
  }, [open, configType, config]);

  // Focus first field when dialog opens
  useEffect(() => {
    if (open && firstFieldRef.current) {
      // Small delay to ensure dialog is mounted
      setTimeout(() => firstFieldRef.current?.focus(), 100);
    }
  }, [open]);

  const handleFieldChange = (fieldName: string, value: any) => {
    const numValue = typeof value === "number" ? value : Number.parseFloat(value);
    setEditedConfig((prev: any) => ({
      ...prev,
      [fieldName]: value,
    }));
    setHasChanges(true);

    // Validate field on change
    validateField(fieldName, typeof value === "number" ? value : numValue);
  };

  const validateField = (name: string, value: any): boolean => {
    const fields = configFields[configType!];
    const field = fields.find((f) => f.name === name);
    const validation = field?.validation;

    if (!validation) return true;

    const errorsCopy = { ...errors };

    if (typeof value === "number" && !Number.isNaN(value)) {
      if (validation.min !== undefined && value < validation.min) {
        errorsCopy[name] = `Value must be at least ${validation.min}${validation.unit || ""}`;
        setErrors(errorsCopy);
        return false;
      }
      if (validation.max !== undefined && value > validation.max) {
        errorsCopy[name] = `Value must be at most ${validation.max}${validation.unit || ""}`;
        setErrors(errorsCopy);
        return false;
      }
    }

    delete errorsCopy[name];
    setErrors(errorsCopy);
    return true;
  };

  const validateAllFields = (): boolean => {
    let isValid = true;
    const newErrors: ValidationErrors = {};

    const fields = configFields[configType!];
    fields.forEach((field) => {
      const value = editedConfig[field.name];
      if (!validateField(field.name, value)) {
        isValid = false;
      }
    });

    return isValid;
  };

  const handleReset = () => {
    if (configType) {
      const fields = configFields[configType];
      const defaults: any = {};
      fields.forEach((field) => {
        if (field.defaultValue !== undefined) {
          defaults[field.name] = field.defaultValue;
        }
      });
      setEditedConfig(defaults);
      setHasChanges(false);
      setErrors({});
    }
  };

  const handleSave = () => {
    if (!validateAllFields()) return;
    onSave(editedConfig);
    setHasChanges(false);
  };

  const toggleSliderMode = (fieldName: string) => {
    setUseSlider((prev) => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const getGroupIcon = (groupName: string) => {
    switch (groupName.toLowerCase()) {
      case "core sampling":
        return <SpeedIcon color="primary" />;
      case "repetition control":
      case "dry parameters":
        return <RefreshIcon color="secondary" />;
      case "gpu settings":
        return <GpuIcon color="primary" />;
      case "cache settings":
      case "memory management":
        return <MemoryIcon color="primary" />;
      case "performance":
      case "power management":
        return <SpeedIcon color="success" />;
      case "model behavior":
        return <BuildIcon color="warning" />;
      case "debugging":
        return <ErrorIcon color="error" />;
      default:
        return <SettingsIcon color="action" />;
    }
  };

  const renderSlider = (field: any, value: any) => {
    const validation = field.validation;
    return (
      <Box sx={{ width: "100%", pr: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {field.label}
            </Typography>
            {field.description && (
              <Tooltip title={field.description} arrow placement="top">
                <InfoIcon fontSize="small" sx={{ opacity: 0.6, cursor: "help" }} />
              </Tooltip>
            )}
          </Box>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ fontFamily: "monospace", minWidth: "3rem", textAlign: "right" }}
          >
            {typeof value === "number" ? value.toFixed(validation?.step < 1 ? 2 : 0) : value}
            {validation?.unit && <Typography component="span" variant="caption"> {validation.unit}</Typography>}
          </Typography>
        </Box>
        <Slider
          value={Number(value) || 0}
          onChange={(_, newValue) => handleFieldChange(field.name, newValue)}
          min={validation?.min ?? 0}
          max={validation?.max ?? 100}
          step={validation?.step ?? 1}
          valueLabelDisplay="off"
          marks={validation?.max && validation.max <= 10 ? Array.from({ length: validation.max + 1 }, (_, i) => ({ value: i, label: i })) : false}
          sx={{
            color: "primary",
            "& .MuiSlider-thumb": {
              transition: "transform 0.2s ease",
              "&:hover": {
                transform: "scale(1.1)",
              },
            },
            "& .MuiSlider-track": {
              height: 6,
            },
            "& .MuiSlider-rail": {
              height: 6,
            },
          }}
        />
      </Box>
    );
  };

  const renderNumberField = (field: any, value: any) => {
    const validation = field.validation;
    return (
      <TextField
        fullWidth
        size="small"
        label={field.label}
        type="number"
        value={value}
        onChange={(e) => handleFieldChange(field.name, Number.parseFloat(e.target.value) || 0)}
        error={!!errors[field.name]}
        helperText={errors[field.name] || field.description}
        InputProps={{
          endAdornment: validation?.unit && (
            <InputAdornment position="end">{validation.unit}</InputAdornment>
          ),
          sx: {
            fontFamily: "monospace",
          },
        }}
        sx={{
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "translateY(-1px)",
          },
          "& .MuiOutlinedInput-root": {
            transition: "all 0.2s ease",
          },
        }}
        inputProps={{
          min: validation?.min,
          max: validation?.max,
          step: validation?.step,
        }}
      />
    );
  };

  const renderField = (field: any, isFirst: boolean = false) => {
    const value = editedConfig[field.name] ?? field.defaultValue;
    const hasError = !!errors[field.name];

    switch (field.type) {
      case "text":
        return (
          <Grid size={{ xs: field.size?.xs || 12, sm: field.size?.sm || 6, md: field.size?.md || 6 }}>
            <TextField
              fullWidth
              size="small"
              label={field.label}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              error={hasError}
              helperText={errors[field.name] || field.description}
              inputRef={isFirst ? firstFieldRef as any : undefined}
              InputProps={{
                startAdornment: field.description && (
                  <Tooltip title={field.description} arrow>
                    <InputAdornment position="start">
                      <InfoIcon fontSize="small" color="action" sx={{ cursor: "help" }} />
                    </InputAdornment>
                  </Tooltip>
                ),
              }}
              sx={{
                transition: "all 0.2s ease",
                "&:hover": {
                  transform: "translateY(-1px)",
                },
              }}
            />
          </Grid>
        );

      case "number":
        return (
          <Grid size={{ xs: field.size?.xs || 12, sm: field.size?.sm || 6, md: field.size?.md || 6 }}>
            {renderNumberField(field, value)}
          </Grid>
        );

      case "slider":
        return (
          <Grid size={{ xs: field.size?.xs || 12, sm: field.size?.sm || 6, md: field.size?.md || 6 }}>
            <Box sx={{ position: "relative" }}>
              {renderSlider(field, value)}
              <IconButton
                size="small"
                onClick={() => toggleSliderMode(field.name)}
                sx={{
                  position: "absolute",
                  right: -8,
                  top: 0,
                  p: 0.5,
                  opacity: 0.5,
                  "&:hover": { opacity: 1 },
                }}
              >
                <KeyboardIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>
        );

      case "select":
        return (
          <Grid size={{ xs: field.size?.xs || 12, sm: field.size?.sm || 6, md: field.size?.md || 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel shrink>{field.label}</InputLabel>
              <Select
                label={field.label}
                value={String(value)}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                startAdornment={
                  field.description && (
                    <Tooltip title={field.description} arrow>
                      <InputAdornment position="start" sx={{ ml: 2 }}>
                        <InfoIcon fontSize="small" color="action" sx={{ cursor: "help" }} />
                      </InputAdornment>
                    </Tooltip>
                  )
                }
                MenuProps={{
                  PaperProps: {
                    sx: { maxHeight: 300, mt: 1 },
                  },
                }}
                sx={{
                  "& .MuiSelect-select": {
                    pl: 2,
                  },
                }}
              >
                {field.options?.map((option: string) => (
                  <MenuItem key={option} value={option}>
                    {option === "" ? "None" : option}
                  </MenuItem>
                ))}
              </Select>
              {field.description && !errors[field.name] && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1 }}>
                  {field.description}
                </Typography>
              )}
            </FormControl>
          </Grid>
        );

      case "boolean":
        return (
          <Grid size={{ xs: field.size?.xs || 12, sm: field.size?.sm || 6, md: field.size?.md || 6 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(value)}
                  onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2">{field.label}</Typography>
                  {field.description && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {field.description}
                    </Typography>
                  )}
                </Box>
              }
              sx={{
                alignItems: "flex-start",
                ml: 0,
                mt: 1,
              }}
            />
          </Grid>
        );

      default:
        return null;
    }
  };

  // Group fields by their group property
  const getGroupedFields = () => {
    if (!configType) return {};
    const fields = configFields[configType];
    const grouped: Record<string, typeof fields> = {};

    fields.forEach((field) => {
      const groupName = field.group || "Other";
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(field);
    });

    return grouped;
  };

  if (!configType || !configFields[configType]) {
    return null;
  }

  const groupedFields = getGroupedFields();
  const configTitle = configType.charAt(0).toUpperCase() + configType.slice(1);
  const hasValidationErrors = Object.keys(errors).length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isMobile ? "md" : "lg"}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          maxHeight: "85vh",
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))"
              : "#ffffff",
        },
      }}
      TransitionComponent={Fade as any}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: 2,
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(13, 158, 248, 0.2)"
                    : "rgba(13, 158, 248, 0.1)",
              }}
            >
              <SettingsIcon color="primary" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Configure {configTitle}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Model ID: {modelId}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ ml: 1 }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {hasValidationErrors && (
            <Alert severity="error" sx={{ mb: 3 }} icon={<ErrorIcon fontSize="inherit" />}>
              Please fix the validation errors before saving
            </Alert>
          )}

          {Object.entries(groupedFields).map(([groupName, fields], groupIndex) => (
            <Accordion
              key={groupName}
              defaultExpanded={groupIndex === 0}
              expanded={expandedGroups === groupName}
              onChange={(_, isExpanded) => setExpandedGroups(isExpanded ? groupName : false)}
              TransitionProps={{ unmountOnExit: false }}
              sx={{
                mb: 2,
                borderRadius: "12px !important",
                "&:before": {
                  display: "none",
                },
                boxShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "0 2px 8px rgba(0, 0, 0, 0.3)"
                    : "0 2px 8px rgba(0, 0, 0, 0.08)",
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.03)"
                    : "rgba(0, 0, 0, 0.02)",
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  borderRadius: "12px",
                  minHeight: 56,
                  "&.Mui-expanded": {
                    minHeight: 56,
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  {getGroupIcon(groupName)}
                  <Typography variant="subtitle2" fontWeight={600}>
                    {groupName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({fields.length} parameters)
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 3 }}>
                <Grid container spacing={2}>
                  {fields.map((field, fieldIndex) => renderField(field, groupIndex === 0 && fieldIndex === 0))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, background: (theme) => (theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.02)") }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ width: "100%", justifyContent: "space-between" }}>
          <Button
            onClick={handleReset}
            startIcon={<RefreshIcon />}
            disabled={!hasChanges}
            sx={{
              transition: "opacity 0.2s ease",
              "&:disabled": {
                opacity: 0.5,
              },
            }}
          >
            Reset to Defaults
          </Button>
          <Stack direction="row" spacing={2}>
            <Button onClick={onClose} variant={isMobile ? "outlined" : "text"}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={!hasChanges || hasValidationErrors}
              startIcon={<SaveIcon />}
              sx={{
                transition: "all 0.2s ease",
                "&:hover": {
                  transform: "translateY(-1px)",
                  boxShadow: 4,
                },
                "&:disabled": {
                  opacity: 0.5,
                },
              }}
            >
              Save Configuration
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
