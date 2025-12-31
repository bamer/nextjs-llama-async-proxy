"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useStore } from "@/lib/store";
import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Card, CardContent, Typography, Box, Grid, Chip, LinearProgress, Button, IconButton, CircularProgress, Menu, MenuItem, Badge, Tooltip } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import { PlayArrow, Stop, Refresh, Add, MoreVert, Delete, Check, Science, Storage, Settings as SettingsIcon } from "@mui/icons-material";
import { useWebSocket } from "@/hooks/use-websocket";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ModelsFallback } from "@/components/ui/error-fallbacks";
import { SkeletonCard } from "@/components/ui";
import { useEffectEvent } from "@/hooks/use-effect-event";
import { loadModelConfig, saveModelConfig } from "@/actions/config-actions";
import ModelConfigDialog, { ConfigType } from "@/components/ui/ModelConfigDialog";
import ModelConfigSidebar from "@/components/ui/ModelConfigSidebar";
import ConfigTypeSelector from "@/components/ui/ConfigTypeSelector";
import { useFitParams, FitParamsData } from "@/hooks/use-fit-params";

// Re-use types and field definitions from ModelConfigDialog
// These are re-used to maintain consistency
export type { ConfigType } from "@/components/ui/ModelConfigDialog";

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
  validation?: any;
  unit?: string;
  step?: number;
  marks?: Array<{ value: number; label: string }>;
}


// Local type definitions (matching database types)
interface ModelConfig {
  id?: number;
  name: string;
  type: "llama" | "gpt" | "mistrall" | "custom";
  status: "running" | "stopped" | "loading" | "error";
  model_path?: string;
  model_url?: string;
  docker_repo?: string;
  hf_repo?: string;
  hf_repo_draft?: string;
  hf_file?: string;
  hf_file_v?: string;
  hf_token?: string;
  ctx_size?: number;
  predict?: number;
  batch_size?: number;
  ubatch_size?: number;
  n_parallel?: number;
  cont_batching?: number;
  threads?: number;
  threads_batch?: number;
  cpu_mask?: string;
  cpu_range?: string;
  cpu_strict?: number;
  cpu_mask_batch?: string;
  cpu_range_batch?: string;
  cpu_strict_batch?: number;
  priority?: number;
  priority_batch?: number;
  created_at?: number;
  updated_at?: number;
}

interface ModelSamplingConfig {
  id?: number;
  model_id?: number;
  temperature?: number;
  top_k?: number;
  top_p?: number;
  min_p?: number;
  top_nsigma?: number;
  xtc_probability?: number;
  xtc_threshold?: number;
  typical_p?: number;
  repeat_last_n?: number;
  repeat_penalty?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  dry_multiplier?: number;
  dry_base?: number;
  dry_allowed_length?: number;
  dry_penalty_last_n?: number;
  dry_sequence_breaker?: string;
  dynatemp_range?: number;
  dynatemp_exponent?: number;
  mirostat?: number;
  mirostat_eta?: number;
  mirostat_tau?: number;
  samplers?: string;
  sampler_seq?: string;
  seed?: number;
  grammar?: string;
  grammar_file?: string;
  json_schema?: string;
  json_schema_file?: string;
  ignore_eos?: number;
  escape?: boolean;
  rope_scaling_type?: string;
  rope_scale?: number;
  rope_freq_base?: number;
  rope_freq_scale?: number;
  yarn_orig_ctx?: number;
  yarn_ext_factor?: number;
  yarn_attn_factor?: number;
  yarn_beta_slow?: number;
  yarn_beta_fast?: number;
  flash_attn?: string;
  logit_bias?: string;
  created_at?: number;
  updated_at?: number;
}

interface ModelMemoryConfig {
  id?: number;
  model_id?: number;
  cache_ram?: number;
  cache_type_k?: string;
  cache_type_v?: string;
  mmap?: number;
  mlock?: number;
  numa?: string;
  defrag_thold?: number;
  created_at?: number;
  updated_at?: number;
}

interface ModelGpuConfig {
  id?: number;
  model_id?: number;
  device?: string;
  list_devices?: number;
  gpu_layers?: number;
  split_mode?: string;
  tensor_split?: string;
  main_gpu?: number;
  kv_offload?: number;
  repack?: number;
  no_host?: number;
  created_at?: number;
  updated_at?: number;
}

interface ModelAdvancedConfig {
  id?: number;
  model_id?: number;
  swa_full?: number;
  override_tensor?: string;
  cpu_moe?: number;
  n_cpu_moe?: number;
  kv_unified?: number;
  pooling?: string;
  context_shift?: number;
  rpc?: string;
  offline?: number;
  override_kv?: string;
  op_offload?: number;
  fit?: string;
  fit_target?: number;
  fit_ctx?: number;
  check_tensors?: number;
  sleep_idle_seconds?: number;
  polling?: string;
  polling_batch?: string;
  reasoning_format?: string;
  reasoning_budget?: number;
  custom_params?: string;
  created_at?: number;
  updated_at?: number;
}

interface ModelLoraConfig {
  id?: number;
  model_id?: number;
  lora?: string;
  lora_scaled?: string;
  control_vector?: string;
  control_vector_scaled?: string;
  control_vector_layer_range?: string;
  model_draft?: string;
  model_url_draft?: string;
  ctx_size_draft?: number;
  threads_draft?: number;
  threads_batch_draft?: number;
  draft_max?: number;
  draft_min?: number;
  draft_p_min?: number;
  cache_type_k_draft?: string;
  cache_type_v_draft?: string;
  cpu_moe_draft?: number;
  n_cpu_moe_draft?: number;
  n_gpu_layers_draft?: number;
  device_draft?: string;
  spec_replace?: string;
  created_at?: number;
  updated_at?: number;
}

interface ModelMultimodalConfig {
  id?: number;
  model_id?: number;
  mmproj?: string;
  mmproj_url?: string;
  mmproj_auto?: number;
  mmproj_offload?: number;
  image_min_tokens?: number;
  image_max_tokens?: number;
  created_at?: number;
  updated_at?: number;
}

  // Helper type for model with lazy-loaded configs
  interface ModelData extends ModelConfig {
    sampling?: ModelSamplingConfig;
    memory?: ModelMemoryConfig;
    gpu?: ModelGpuConfig;
    advanced?: ModelAdvancedConfig;
    lora?: ModelLoraConfig;
    multimodal?: ModelMultimodalConfig;
    _configsLoading?: Set<string>;
  }

  // Helper function to convert store model to database model format
  function storeToDatabaseModel(storeModel: import('@/types').ModelConfig): Omit<ModelConfig, 'id' | 'created_at' | 'updated_at'> {
    // Map store type to database type
    const typeMap: Record<"llama" | "mistral" | "other", "llama" | "gpt" | "mistrall" | "custom"> = {
      llama: "llama",
      mistral: "mistrall",
      other: "custom",
    };

    return {
      name: storeModel.name,
      type: typeMap[storeModel.type] || 'llama',
      status: storeModel.status === 'running' || storeModel.status === 'loading' || storeModel.status === 'error'
        ? storeModel.status
        : 'stopped',
      ctx_size: (storeModel.parameters?.ctx_size as number) ?? 0,
      batch_size: (storeModel.parameters?.batch_size as number) ?? 2048,
      threads: (storeModel.parameters?.threads as number) ?? -1,
      model_path: (storeModel.parameters?.model_path as string) ?? undefined,
      model_url: (storeModel.parameters?.model_url as string) ?? undefined,
    };
  }

  // Helper function to convert store model to ModelData format
  function storeToModelData(storeModel: import('@/types').ModelConfig): ModelData {
    const typeMap: Record<"llama" | "mistral" | "other", "llama" | "gpt" | "mistrall" | "custom"> = {
      llama: "llama",
      mistral: "mistrall",
      other: "custom",
    };

    return {
      id: parseInt(storeModel.id, 10),
      name: storeModel.name,
      type: typeMap[storeModel.type] || 'llama',
      status: storeModel.status === 'running' || storeModel.status === 'loading' || storeModel.status === 'error'
        ? storeModel.status
        : 'stopped',
      ctx_size: (storeModel.parameters?.ctx_size as number) ?? 0,
      batch_size: (storeModel.parameters?.batch_size as number) ?? 2048,
      threads: (storeModel.parameters?.threads as number) ?? -1,
      model_path: (storeModel.parameters?.model_path as string) ?? undefined,
      model_url: (storeModel.parameters?.model_url as string) ?? undefined,
    };
  }

  // Helper function to format file size
  function formatFileSize(bytes: number | undefined | null): string {
    if (!bytes) return "Unknown";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

function ModelsPage() {
  const models = useStore((state) => state.models);
  const { isDark } = useTheme();
  const [loading, setLoading] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const { requestModels, sendMessage, on, off } = useWebSocket();
   const setModels = useStore((state) => state.setModels);
   const updateStoreModel = useStore((state) => state.updateModel);

   // Sidebar state for configuration
   const [configSidebarOpen, setConfigSidebarOpen] = useState(false);
   const [editingConfigType, setEditingConfigType] = useState<ConfigType | null>(null);
   const [editedConfig, setEditedConfig] = useState<Record<string, unknown>>({});
   const [selectedModel, setSelectedModel] = useState<ModelData | null>(null);
   const [sidebarConfig, setSidebarConfig] = useState<any>(null);
   const [hasChanges, setHasChanges] = useState(false);

   // Notification state
   const [notification, setNotification] = useState<{
     open: boolean;
     message: string;
     severity: "success" | "error";
   }>({ open: false, message: "", severity: "success" });

   // Fit params state for selected model (for analysis dialog)
   const [analyzingModelId, setAnalyzingModelId] = useState<string | null>(null);
   const [fitParamsDialogOpen, setFitParamsDialogOpen] = useState(false);
   const [currentFitParams, setCurrentFitParams] = useState<FitParamsData | null>(null);


  // Fit params hook for the selected model (uses model name, not ID)
  const fitParamsHook = useFitParams(analyzingModelId);

  useEffect(() => {
    // Load models from database as source of truth
    sendMessage('load_models', {});
    console.log("[ModelsPage] Loading models from database");
    // Set initial loading to false after a brief delay
    setTimeout(() => setIsInitialLoading(false), 1000);
  }, [sendMessage]);

      // Handle WebSocket responses for database operations
      useEffect(() => {
        // Listen for WebSocket messages via websocket-client
        const handleModelsLoaded = (data: any) => {
          if (data.success) {
            console.log("[ModelsPage] Models loaded successfully:", data.data);
            // Update store with loaded models (including configs)
            setModels(data.data);
          } else {
            console.error("[ModelsPage] Failed to load models:", data.error);
          }
        };

        const handleConfigLoaded = (data: any) => {
          if (data.success) {
            console.log("[ModelsPage] Config loaded successfully:", data.data);
            const { id, type, config } = data.data;

            // Update sidebar config if this config type was requested and matches current model
            if (type === editingConfigType && id === selectedModel?.id) {
              setSidebarConfig(config);
              // Update edited config with new data
              setEditedConfig(prev => ({
                ...prev,
                ...config
              }));
            }
          } else {
            console.error("[ModelsPage] Failed to load config:", data.error);
          }
        };

        const handleConfigSaved = (data: any) => {
          if (data.success) {
            console.log("[ModelsPage] Config saved successfully:", data.data);
            // Close sidebar on successful save
            setConfigSidebarOpen(false);
            setHasChanges(false);
            setError(null);
            setNotification({
              open: true,
              message: "Configuration saved successfully",
              severity: "success"
            });
          } else {
            console.error("[ModelsPage] Failed to save config:", data.error);
            setError(`Failed to save config: ${data.error?.message || 'Unknown error'}`);
            setNotification({
              open: true,
              message: `Failed to save config: ${data.error?.message || 'Unknown error'}`,
              severity: "error"
            });
          }
        };

        const handleModelDeleted = (data: any) => {
          if (data.success) {
            console.log("[ModelsPage] Model deleted successfully:", data.data);
            // Remove model from store
            const dbId = data.data.id;
            useStore.getState().removeModel(dbId.toString());
          } else {
            console.error("[ModelsPage] Failed to delete model:", data.error);
            setError(`Failed to delete model: ${data.error?.message || 'Unknown error'}`);
          }
        };

        // Register listeners for database events
        on('models_loaded', handleModelsLoaded);
        on('config_loaded', handleConfigLoaded);
        on('config_saved', handleConfigSaved);
        on('model_deleted', handleModelDeleted);

        return () => {
          // Remove listeners
          off('models_loaded', handleModelsLoaded);
          off('config_loaded', handleConfigLoaded);
          off('config_saved', handleConfigSaved);
          off('model_deleted', handleModelDeleted);
        };
      }, [editingConfigType, selectedModel, on, off]);


  // Helper functions defined outside component (created once)
  const normalizeStatus = useCallback((status: string | { value?: string; args?: unknown; preset?: unknown } | unknown): string => {
    if (typeof status === 'string') {
      return status;
    }
    if (status && typeof status === 'object' && 'value' in status && typeof status.value === 'string') {
      return status.value;
    }
    return 'idle';
  }, []);

  const getStatusColor = useCallback((status: string | { value?: string; args?: unknown; preset?: unknown } | unknown) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case 'running': return 'success';
      case 'loading': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  }, [normalizeStatus]);

  // Open configuration sidebar for a specific model
  const handleConfigure = useEffectEvent(async (model: ModelData) => {
    if (!model.id) return;

    // Set editing state
    setSelectedModel(model);
    setEditingConfigType('sampling'); // Start with sampling as default
    setError(null);

    // Initialize edited config with current model configs from parameters object
    const initialConfig: Record<string, unknown> = {};
    const params = model.parameters || {};

    // Load all available configs from parameters
    if (params.sampling) initialConfig['sampling'] = params.sampling;
    if (params.memory) initialConfig['memory'] = params.memory;
    if (params.gpu) initialConfig['gpu'] = params.gpu;
    if (params.advanced) initialConfig['advanced'] = params.advanced;
    if (params.lora) initialConfig['lora'] = params.lora;
    if (params.multimodal) initialConfig['multimodal'] = params.multimodal;

    setEditedConfig(initialConfig);

    // Load configs via WebSocket if not already loaded
    if (!params.sampling) {
      sendMessage('load_config', { id: model.id, type: 'sampling' });
    }
    if (!params.memory) {
      sendMessage('load_config', { id: model.id, type: 'memory' });
    }
    if (!params.gpu) {
      sendMessage('load_config', { id: model.id, type: 'gpu' });
    }
    if (!params.advanced) {
      sendMessage('load_config', { id: model.id, type: 'advanced' });
    }
    if (!params.lora) {
      sendMessage('load_config', { id: model.id, type: 'lora' });
    }
    if (!params.multimodal) {
      sendMessage('load_config', { id: model.id, type: 'multimodal' });
    }

    // Open sidebar
    setConfigSidebarOpen(true);
    console.log(`[ModelsPage] Opening config sidebar for model ${model.name}`);
  });

  // Use useEffectEvent for handlers to keep them stable
  const handleStartModel = useEffectEvent(async (modelId: string) => {
    // Find the model to get its name and database ID
    const model = useStore.getState().models.find((m) => m.id === modelId);
    if (!model) {
      setError(`Model ${modelId} not found`);
      return;
    }

    setLoading(modelId);
    setError(null);

    try {
      updateStoreModel(modelId, { status: "loading" });

      // Update status in database via WebSocket (non-blocking)
      const dbId = parseInt(modelId, 10);
      if (!isNaN(dbId)) {
        sendMessage('update_model', { id: dbId, updates: { status: "loading" } });
      }

      // Make real API call to load the model in llama-server
      const response = await fetch(`/api/models/${encodeURIComponent(model.name)}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to load model (HTTP ${response.status})`);
      }

      // Only update to running after actual confirmation from llama-server
      updateStoreModel(modelId, { status: "running" });

      // Update status in database via WebSocket (non-blocking)
      if (!isNaN(dbId)) {
        sendMessage('update_model', { id: dbId, updates: { status: "running" } });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      updateStoreModel(modelId, { status: "idle" });

      // Update status in database via WebSocket (non-blocking)
      const dbId = parseInt(modelId, 10);
      if (!isNaN(dbId)) {
        sendMessage('update_model', { id: dbId, updates: { status: "stopped" } });
      }
    } finally {
      setLoading(null);
    }
  });

  const handleStopModel = useEffectEvent(async (modelId: string) => {
    // Find the model to get its name
    const model = useStore.getState().models.find((m) => m.id === modelId);
    if (!model) {
      setError(`Model ${modelId} not found`);
      return;
    }

    setLoading(modelId);
    setError(null);

    try {
      updateStoreModel(modelId, { status: "loading" });

      // Update status in database via WebSocket (non-blocking)
      const dbId = parseInt(modelId, 10);
      if (!isNaN(dbId)) {
        sendMessage('update_model', { id: dbId, updates: { status: "loading" } });
      }

      // Make real API call to unload the model from llama-server
      const response = await fetch(`/api/models/${encodeURIComponent(model.name)}/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to unload model (HTTP ${response.status})`);
      }

      // Only update to idle after actual confirmation from llama-server
      updateStoreModel(modelId, { status: "idle" });

      // Update status in database via WebSocket (non-blocking)
      if (!isNaN(dbId)) {
        sendMessage('update_model', { id: dbId, updates: { status: "stopped" } });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      updateStoreModel(modelId, { status: "running" });

      // Update status in database via WebSocket (non-blocking)
      const dbId = parseInt(modelId, 10);
      if (!isNaN(dbId)) {
        sendMessage('update_model', { id: dbId, updates: { status: "running" } });
      }
    } finally {
      setLoading(null);
    }
  });

  const handleRefresh = useEffectEvent(() => {
    setRefreshing(true);
    // Trigger WebSocket rescan to reload models from filesystem and database
    sendMessage('rescanModels', {});
    setTimeout(() => setRefreshing(false), 1500);
  });

  // Handler for saving a model configuration (can be used by add/edit model dialogs) using WebSocket
  const handleSaveModel = useEffectEvent(async (config: Partial<import("@/types").ModelConfig>) => {
    const allModels = useStore.getState().models;
    const existing = allModels.find((m) => m.name === config.name);

    if (existing) {
      // Update existing model
      const updatedModel = { ...existing, ...config };
      updateStoreModel(existing.id, config);

      // Update in database via WebSocket (non-blocking)
      const dbId = parseInt(existing.id, 10);
      if (!isNaN(dbId)) {
        sendMessage('update_model', {
          id: dbId,
          updates: storeToDatabaseModel(updatedModel)
        });
        console.log("[ModelsPage] Updating model in database:", existing.name);
      }
    } else if (config.name) {
      // Create new model
      const newModel: import("@/types").ModelConfig = {
        id: Date.now().toString(), // Temporary ID, will be replaced by database
        name: config.name,
        type: config.type || "llama",
        parameters: config.parameters || {},
        status: "idle", // Store uses "idle" instead of "stopped"
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Send WebSocket message to save model
      sendMessage('save_model', {
        name: newModel.name,
        type: newModel.type === "mistral" ? "mistrall" : newModel.type === "other" ? "custom" : newModel.type,
        status: "stopped",
        ctx_size: (newModel.parameters?.ctx_size as number) ?? 0,
        batch_size: (newModel.parameters?.batch_size as number) ?? 2048,
        threads: (newModel.parameters?.threads as number) ?? -1,
        model_path: (newModel.parameters?.model_path as string) ?? undefined,
        model_url: (newModel.parameters?.model_url as string) ?? undefined,
      });
      console.log("[ModelsPage] Creating new model:", newModel.name);

      // Add to store with temporary ID (will be updated when response comes back)
      useStore.getState().addModel(newModel);
    }
  });

  // Handler for deleting a model using WebSocket
  const handleDeleteModel = useEffectEvent(async (modelId: string) => {
    const model = useStore.getState().models.find((m) => m.id === modelId);
    if (!model) {
      console.error("[ModelsPage] Model not found:", modelId);
      return;
    }

    // Remove from store
    useStore.getState().removeModel(modelId);

    // Send WebSocket message to delete from database (non-blocking)
    const dbId = parseInt(modelId, 10);
    if (!isNaN(dbId)) {
      sendMessage('delete_model', { id: dbId });
      console.log("[ModelsPage] Deleting model from database:", modelId);
    }

    // Close menu
    setAnchorEl(null);
    setSelectedModelId(null);
  });

  // Menu handlers
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, modelId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedModelId(modelId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedModelId(null);
  };

  const handleDeleteClick = () => {
    if (selectedModelId) {
      handleDeleteModel(selectedModelId);
    }
  };

  // Handle fit-params analysis
  const handleAnalyze = useEffectEvent(async (modelName: string) => {
    setAnalyzingModelId(modelName);
    setCurrentFitParams(null);
    setFitParamsDialogOpen(true);

    try {
      // Trigger analysis
      await fitParamsHook.analyze();

      // Check for errors from hook
      if (fitParamsHook.error) {
        setNotification({
          open: true,
          message: `Analysis failed: ${fitParamsHook.error}`,
          severity: "error"
        });
      }

      // Get results
      if (fitParamsHook.data) {
        setCurrentFitParams(fitParamsHook.data);
        setNotification({
          open: true,
          message: 'Analysis completed successfully!',
          severity: "success"
        });
      } else if (!fitParamsHook.error) {
        setNotification({
          open: true,
          message: 'Analysis completed but no data available',
          severity: "info"
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Analysis error: ${message}`);
      setNotification({
        open: true,
        message,
        severity: "error"
      });
    }

    setAnalyzingModelId(null);
  });

  // Show skeleton loader during initial load
  if (isInitialLoading && models.length === 0) {
    return (
      <MainLayout>
        <Box sx={{ p: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
              AI Models Management
            </Typography>
            <LinearProgress sx={{ height: 4, borderRadius: 2 }} />
          </Box>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <SkeletonCard height={200} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <SkeletonCard height={200} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <SkeletonCard height={200} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <SkeletonCard height={200} />
            </Grid>
          </Grid>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ErrorBoundary fallback={<ModelsFallback />}>
        <Box sx={{ p: 4 }}>
        {/* Error message */}
        {error && (
          <Box
            sx={{
              p: 2,
              mb: 3,
              bgcolor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        )}

        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <div>
            <Typography variant="h3" component="h1" fontWeight="bold">
              AI Models Management
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Configure and monitor your AI models
            </Typography>
          </div>
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              sx={{ mt: 3 }}
              onClick={() => {
                console.log('Add new model - feature coming soon');
                // TODO: Implement add model dialog
              }}
            >
              Add Model
            </Button>
            <IconButton
              onClick={handleRefresh}
              color="primary"
              disabled={refreshing}
              sx={{
                background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(13, 158, 248, 0.1)',
                '&:hover': {
                  background: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(13, 158, 248, 0.2)'
                }
              }}
            >
              {refreshing ? <CircularProgress size={20} /> : <Refresh />}
            </IconButton>
          </Box>
        </Box>

        {/* Models Grid */}
        <Grid container spacing={3}>
          {models.map((model) => {
            return (
              <Grid key={model.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card
                  sx={{
                    height: '100%',
                    background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${isDark ? 'rgba(255,255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: isDark ? '0 12px 24px rgba(0, 0, 0, 0.2)' : '0 12px 24px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {model.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={normalizeStatus(model.status)}
                          color={getStatusColor(model.status) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                          size="small"
                          variant="filled"
                        />
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, model.id)}
                          sx={{
                            '&:hover': {
                              background: isDark ? 'rgba(255,255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                            }
                          }}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {model.type}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Created: {new Date(model.createdAt).toLocaleDateString()}
                      </Typography>
                      <Tooltip title="Analyze model with llama-fit-params">
                        <IconButton
                          size="small"
                          onClick={() => handleAnalyze(model.name)}
                          disabled={analyzingModelId === model.name}
                          sx={{
                            background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(13, 158, 248, 0.1)',
                            '&:hover': {
                              background: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(13, 158, 248, 0.2)'
                            }
                          }}
                        >
                          {analyzingModelId === model.name ? <CircularProgress size={16} /> : <Science fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* Model metadata from fit-params */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {(model.parameters?.fit_params_available) ? (
                        <Chip
                          icon={<Check sx={{ fontSize: 12 }} />}
                          label="Fit-Params Analyzed"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ) : null}
                      {(model.parameters?.file_size_bytes) ? (
                        <Chip
                          icon={<Storage sx={{ fontSize: 12 }} />}
                          label={formatFileSize(model.parameters.file_size_bytes as number)}
                          size="small"
                          variant="outlined"
                        />
                      ) : null}
                      {(model.parameters?.quantization_type) ? (
                        <Chip
                          label={`${model.parameters.quantization_type}`}
                          size="small"
                          variant="outlined"
                        />
                      ) : null}
                      {(model.parameters?.parameter_count) ? (
                        <Chip
                          label={`${model.parameters.parameter_count}B`}
                          size="small"
                          variant="outlined"
                        />
                      ) : null}
                    </Box>

                     {/* Config loaded indicators */}
                     <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
                       <Badge
                         color={storeToModelData(model).sampling ? 'success' : 'default'}
                         overlap="circular"
                         badgeContent={storeToModelData(model).sampling ? <Check sx={{ fontSize: 10 }} /> : null}
                         sx={{
                           '& .MuiBadge-badge': {
                             width: 14,
                             height: 14,
                             minWidth: 14,
                             borderRadius: 7
                           }
                         }}
                       >
                       </Badge>
                     </Box>

                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, mt: 2 }}>
                        <Tooltip title="Configure model parameters">
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SettingsIcon />}
                            size="small"
                            onClick={() => handleConfigure(storeToModelData(model))}
                            sx={{
                              minWidth: 80,
                              "&:hover": {
                                transform: "translateY(-1px)",
                              }
                            }}
                          >
                            Config
                          </Button>
                        </Tooltip>
                        {normalizeStatus(model.status) === 'running' ? (
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Stop />}
                            size="small"
                            disabled={loading === model.id}
                            onClick={() => handleStopModel(model.id)}
                          >
                            {loading === model.id ? 'Stopping...' : 'Stop'}
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<PlayArrow />}
                            size="small"
                            disabled={loading === model.id}
                            onClick={() => handleStartModel(model.id)}
                          >
                            {loading === model.id ? 'Starting...' : 'Start'}
                          </Button>
                        )}
                       </Box>
                   </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Context menu for model actions */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 1 }} />
            Delete Model
          </MenuItem>
        </Menu>

         {/* Model Configuration Sidebar */}
         <ModelConfigSidebar
           open={configSidebarOpen}
           onClose={() => setConfigSidebarOpen(false)}
           modelId={selectedModel?.id}
           configType={editingConfigType}
           config={editedConfig}
           onSave={(config) => {
             if (selectedModel && editingConfigType) {
               // Send WebSocket message to save config
               sendMessage('save_config', {
                 id: selectedModel.id,
                 type: editingConfigType,
                 config
               });
               console.log(`[ModelsPage] Saving ${editingConfigType} config for model ${selectedModel.name}`);
             }
           }}
           editedConfig={editedConfig}
           onFieldChange={(name, value) => {
             setEditedConfig(prev => ({
               ...prev,
               [name]: value
             }));
             setHasChanges(true);
           }}
           hasChanges={hasChanges}
           isSaving={loading !== null}
           error={error}
           notification={notification ? {
             open: notification.open,
             message: notification.message,
             severity: notification.severity
           } : undefined}
           onDismissNotification={() => setNotification({ ...notification, open: false })}
           onReset={() => {
             // Reset to current loaded config
             if (sidebarConfig) {
               setEditedConfig(sidebarConfig);
             }
             setHasChanges(false);
           }}
         >
            <ConfigTypeSelector
              selectedType={editingConfigType}
              onSelect={setEditingConfigType}
              compact={true}
            />
            {/* Display current config values */}
            <Box sx={{ p: 2, mt: 2 }}>
              {editingConfigType ? (
                <>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {editingConfigType.charAt(0).toUpperCase() + editingConfigType.slice(1)} Configuration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {Object.keys(editedConfig).length > 0
                      ? `${Object.keys(editedConfig).length} parameter(s) configured`
                      : 'No configuration saved yet'}
                  </Typography>
                  {/* Show some sample config values */}
                  {editedConfig && Object.keys(editedConfig).length > 0 && (
                    <Box sx={{
                      p: 2,
                          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(13, 158, 248, 0.1)',
                      borderRadius: 1,
                      maxHeight: 400,
                      overflowY: 'auto'
                    }}>
                      {Object.entries(editedConfig).slice(0, 10).map(([key, value]: [string, unknown]) => (
                        <Box key={key} sx={{ mb: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            {key.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase())}
                          </Typography>
                          <Typography variant="body2" sx={{
                            fontFamily: 'monospace',
                            wordBreak: 'break-all',
                            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(13, 158, 248, 0.1)',
                            p: 1,
                            borderRadius: 0.5
                          }}>
                            {typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}
                          </Typography>
                        </Box>
                      ))}
                      {Object.keys(editedConfig).length > 10 && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                          ... and {Object.keys(editedConfig).length - 10} more
                        </Typography>
                      )}
                    </Box>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Select a configuration type above to view and edit parameters
                </Typography>
              )}
            </Box>
          </ModelConfigSidebar>

         {/* Empty state */}
         {models.length === 0 && (
           <Box sx={{
             textAlign: 'center',
             py: 8,
             border: `2px dashed ${isDark ? 'rgba(255,255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
             borderRadius: '8px',
             mt: 4
           }}>
             <Typography variant="h6" color="text.secondary" gutterBottom>
               No models found
             </Typography>
             <Typography variant="body2" color="text.secondary">
               Add your first AI model to get started
             </Typography>
             <Button
               variant="contained"
               color="primary"
               startIcon={<Add />}
               onClick={handleConfigure}
             >
               Add Model
             </Button>
            </Box>
          )}
        </Box>
       </ErrorBoundary>
     </MainLayout>
   );
}
 
 export default ModelsPage;

