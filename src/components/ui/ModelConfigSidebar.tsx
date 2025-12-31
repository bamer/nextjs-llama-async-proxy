"use client";

import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  CircularProgress,
  Chip,
  Toolbar,
} from "@mui/material";
import {
  Close as CloseIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { memo } from "react";
import { getTooltipContent } from "@/config/tooltip-config";
import { FieldWithTooltip } from "./FormTooltip";
import { useTheme } from "@mui/material/styles";
import { TooltipContent } from "@/config/tooltip-config";

// Re-use types and field definitions from ModelConfigDialog
export type ConfigType =
  | "sampling"
  | "memory"
  | "gpu"
  | "advanced"
  | "lora"
  | "multimodal";

interface ModelConfigSidebarProps {
  open: boolean;
  onClose: () => void;
  modelId: number | undefined;
  configType: ConfigType | null;
  config: Record<string, unknown>;
  onSave: (config: Record<string, unknown>) => void;
  editedConfig: Record<string, unknown>;
  onFieldChange: (name: string, value: unknown) => void;
  hasChanges: boolean;
  isSaving: boolean;
  error: string | null;
  notification?: {
    open: boolean;
    message: string;
    severity: "success" | "error";
  };
  onDismissNotification: () => void;
  onReset: () => void;
  children?: React.ReactNode;
}

// Section groups (same as ModelConfigDialog)
const sectionGroups: Record<ConfigType, Array<{ title: string; icon: React.ReactNode; fields: string[] }>> = {
  sampling: [
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
  ],
  memory: [
    {
      title: "Cache Settings",
      icon: "💾",
      fields: ["cache_ram", "cache_type_k", "cache_type_v"],
    },
    {
      title: "Memory Management",
      icon: "🔧",
      fields: ["mmap", "mlock", "numa", "defrag_thold"],
    },
  ],
  gpu: [
    {
      title: "Device Selection",
      icon: "🎮",
      fields: ["device", "list_devices"],
    },
    {
      title: "GPU Configuration",
      icon: "⚙️",
      fields: ["gpu_layers", "split_mode", "tensor_split", "main_gpu", "kv_offload"],
    },
    {
      title: "Performance Options",
      icon: "⚡",
      fields: ["repack", "no_host"],
    },
  ],
  advanced: [
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
  ],
  lora: [
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
  ],
  multimodal: [
    {
      title: "Vision Projection",
      icon: "👁",
      fields: ["mmproj", "mmproj_url", "mmproj_auto", "mmproj_offload"],
    },
    {
      title: "Image Processing",
      icon: "🖼",
      fields: ["image_min_tokens", "image_max_tokens"],
    },
  ],
};

const ModelConfigSidebar = memo(({
  open,
  onClose,
  modelId,
  configType,
  config,
  onSave,
  editedConfig,
  onFieldChange,
  hasChanges,
  isSaving,
  error,
  notification,
  onDismissNotification,
  onReset,
  children,
}: ModelConfigSidebarProps) => {
  const theme = useTheme();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 500,
          maxWidth: "90vw",
          backgroundColor: theme.palette.mode === "dark" ? "grey.900" : "#ffffff",
        },
      }}
      sx={{
        "& .MuiDrawer-paper": {
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          backgroundColor: theme.palette.mode === "dark" ? "primary.dark" : "primary.main",
          color: theme.palette.primary.contrastText,
        }}
      >
        <Toolbar disableGutters sx={{ minHeight: "auto", px: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
            <SettingsIcon fontSize="medium" />
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
              Model Configuration
            </Typography>
            {modelId && (
              <Chip
                label={`ID: ${modelId}`}
                size="small"
                sx={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "inherit",
                  fontSize: "0.75rem",
                }}
              />
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {hasChanges && (
              <Typography
                variant="caption"
                sx={{
                  color: "warning.light",
                  fontWeight: 500,
                }}
              >
                Unsaved
              </Typography>
            )}
            <IconButton
              onClick={onClose}
              sx={{ color: "inherit" }}
              aria-label="Close configuration"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </Box>

      {/* Error Message */}
      {error && (
        <Box
          sx={{
            p: 2,
            backgroundColor: theme.palette.error.main + "15",
            borderBottom: `1px solid ${theme.palette.error.main}`,
          }}
        >
          <Typography variant="body2" color="error" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ErrorIcon fontSize="small" />
            {error}
          </Typography>
        </Box>
      )}

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.mode === "dark" ? "grey.800" : "grey.50",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
          <Button
            onClick={onReset}
            startIcon={<RestoreIcon />}
            color="warning"
            sx={{
              minWidth: 120,
              "&:hover": {
                backgroundColor: theme.palette.warning.light,
                color: theme.palette.warning.dark,
              },
            }}
          >
            Reset
          </Button>
          <Button
            onClick={onSave}
            variant="contained"
            color="primary"
            startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            disabled={!hasChanges || isSaving}
            sx={{
              minWidth: 140,
              fontWeight: 600,
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: theme.shadows[4],
              },
              "&:active": {
                transform: "translateY(0)",
              },
            }}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </Box>

      {/* Notification Snackbar */}
      {notification?.open && (
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            right: 516, // Sidebar width + 16px
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: 2,
              borderRadius: 1,
              backgroundColor:
                notification.severity === "success"
                  ? theme.palette.success.main
                  : theme.palette.error.main,
              color: "white",
              boxShadow: theme.shadows[6],
            }}
          >
            {notification.severity === "success" ? <CheckCircleIcon /> : <ErrorIcon />}
            <Typography variant="body2">{notification.message}</Typography>
            <IconButton
              size="small"
              onClick={onDismissNotification}
              sx={{ color: "inherit" }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      )}
    </Drawer>
  );
});

ModelConfigSidebar.displayName = "ModelConfigSidebar";

export default ModelConfigSidebar;
