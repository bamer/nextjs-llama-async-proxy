"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useStore } from "@/lib/store";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, Typography, Box, Grid, Chip, LinearProgress, Button, IconButton, CircularProgress, Menu, MenuItem } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import { PlayArrow, Stop, Refresh, Add, MoreVert, Delete } from "@mui/icons-material";
import { useWebSocket } from "@/hooks/use-websocket";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ModelsFallback } from "@/components/ui/error-fallbacks";
import { SkeletonCard } from "@/components/ui";
import { useEffectEvent } from "@/hooks/use-effect-event";
import { getModels, saveModel, updateModel, deleteModel } from "@/lib/database";
import type { ModelConfig as DatabaseModelConfig } from "@/lib/database";

// Helper function to convert database model to store model format
function databaseToStoreModel(dbModel: DatabaseModelConfig): import('@/types').ModelConfig {
  // Map database type to store type
  const typeMap: Record<string, "llama" | "mistral" | "other"> = {
    llama: "llama",
    gpt: "other",
    mistrall: "mistral", // Note: database has typo 'mistrall'
    custom: "other",
  };

  const result: import('@/types').ModelConfig = {
    id: dbModel.id?.toString() || '',
    name: dbModel.name,
    type: typeMap[dbModel.type] || 'other',
    parameters: {
      ctx_size: dbModel.ctx_size,
      batch_size: dbModel.batch_size,
      threads: dbModel.threads,
      gpu_layers: dbModel.gpu_layers,
      temperature: dbModel.temperature,
      top_k: dbModel.top_k,
      top_p: dbModel.top_p,
      model_path: dbModel.model_path,
      model_url: dbModel.model_url,
    } as Record<string, unknown>,
    status: dbModel.status === 'running' || dbModel.status === 'loading' || dbModel.status === 'error'
      ? dbModel.status
      : 'idle',
    createdAt: dbModel.created_at ? new Date(dbModel.created_at).toISOString() : new Date().toISOString(),
    updatedAt: dbModel.updated_at ? new Date(dbModel.updated_at).toISOString() : new Date().toISOString(),
  };

  // Only add optional fields if they exist
  if (dbModel.chat_template) {
    result.template = dbModel.chat_template;
  }

  return result;
}

// Helper function to convert store model to database model format
function storeToDatabaseModel(storeModel: import('@/types').ModelConfig): Omit<DatabaseModelConfig, 'id' | 'created_at' | 'updated_at'> {
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
    gpu_layers: (storeModel.parameters?.gpu_layers as number) ?? -1,
    temperature: (storeModel.parameters?.temperature as number) ?? 0.8,
    top_k: (storeModel.parameters?.top_k as number) ?? 40,
    top_p: (storeModel.parameters?.top_p as number) ?? 0.9,
    model_path: (storeModel.parameters?.model_path as string) ?? undefined,
    model_url: (storeModel.parameters?.model_url as string) ?? undefined,
  };
}

export default function ModelsPage() {
  const models = useStore((state) => state.models);
  const { isDark } = useTheme();
  const [loading, setLoading] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const { requestModels } = useWebSocket();
  const setModels = useStore((state) => state.setModels);
  const updateStoreModel = useStore((state) => state.updateModel);

  useEffect(() => {
    // Load all models from database on mount
    try {
      const dbModels = getModels();
      const storeModels = dbModels.map(databaseToStoreModel);
      if (storeModels.length > 0) {
        setModels(storeModels);
        console.log('[ModelsPage] Loaded models from database:', storeModels.length, 'models');
      }
    } catch (err) {
      console.error('[ModelsPage] Failed to load models from database:', err);
    }

    // Request models from WebSocket to get latest state
    requestModels();
    // Set initial loading to false after a brief delay
    const timer = setTimeout(() => setIsInitialLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [requestModels, setModels]);

  // Helper functions defined outside component (created once)
  const normalizeStatus = (status: string | { value?: string; args?: unknown; preset?: unknown } | unknown): string => {
    if (typeof status === 'string') {
      return status;
    }
    if (status && typeof status === 'object' && 'value' in status && typeof status.value === 'string') {
      return status.value;
    }
    return 'idle';
  };

  const getStatusColor = (status: string | { value?: string; args?: unknown; preset?: unknown } | unknown) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case 'running': return 'success';
      case 'loading': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

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
      updateStoreModel(modelId, { status: 'loading' });

      // Update status in database (non-blocking)
      try {
        updateModel(parseInt(modelId, 10), { status: 'loading' });
      } catch (dbErr) {
        console.error('[ModelsPage] Failed to update model status in database:', dbErr);
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
      updateStoreModel(modelId, { status: 'running' });

      // Update status in database (non-blocking)
      try {
        updateModel(parseInt(modelId, 10), { status: 'running' });
      } catch (dbErr) {
        console.error('[ModelsPage] Failed to update model status in database:', dbErr);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      updateStoreModel(modelId, { status: 'idle' });

      // Update status in database (non-blocking)
      try {
        updateModel(parseInt(modelId, 10), { status: 'stopped' });
      } catch (dbErr) {
        console.error('[ModelsPage] Failed to update model status in database:', dbErr);
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
      updateStoreModel(modelId, { status: 'loading' });

      // Update status in database (non-blocking)
      try {
        updateModel(parseInt(modelId, 10), { status: 'loading' });
      } catch (dbErr) {
        console.error('[ModelsPage] Failed to update model status in database:', dbErr);
      }

      // Make real API call to unload the model from llama-server
      const response = await fetch(`/api/models/${encodeURIComponent(model.name)}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to unload model (HTTP ${response.status})`);
      }

      // Only update to idle after actual confirmation from llama-server
      updateStoreModel(modelId, { status: 'idle' });

      // Update status in database (non-blocking)
      try {
        updateModel(parseInt(modelId, 10), { status: 'stopped' });
      } catch (dbErr) {
        console.error('[ModelsPage] Failed to update model status in database:', dbErr);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      updateStoreModel(modelId, { status: 'running' });

      // Update status in database (non-blocking)
      try {
        updateModel(parseInt(modelId, 10), { status: 'running' });
      } catch (dbErr) {
        console.error('[ModelsPage] Failed to update model status in database:', dbErr);
      }
    } finally {
      setLoading(null);
    }
  });

  const handleRefresh = useEffectEvent(() => {
    setRefreshing(true);
    requestModels();
    setTimeout(() => setRefreshing(false), 800);
  });

  // Handler for saving a model configuration (can be used by add/edit model dialogs)
  const handleSaveModel = useEffectEvent((config: Partial<import('@/types').ModelConfig>) => {
    const allModels = useStore.getState().models;
    const existing = allModels.find((m) => m.name === config.name);

    if (existing) {
      // Update existing model
      const updatedModel = { ...existing, ...config };
      updateStoreModel(existing.id, config);

      // Update in database (non-blocking)
      try {
        updateModel(parseInt(existing.id, 10), storeToDatabaseModel(updatedModel));
      } catch (dbErr) {
        console.error('[ModelsPage] Failed to update model in database:', dbErr);
      }
    } else if (config.name) {
      // Create new model
      const newModel: import('@/types').ModelConfig = {
        id: Date.now().toString(), // Temporary ID, will be replaced by database
        name: config.name,
        type: config.type || 'llama',
        parameters: config.parameters || {},
        status: 'idle', // Store uses 'idle' instead of 'stopped'
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to database to get real ID
      let dbId: number | undefined;
      try {
        dbId = saveModel(storeToDatabaseModel(newModel));
        newModel.id = dbId.toString();
        useStore.getState().addModel(newModel);
        console.log('[ModelsPage] Created new model with ID:', dbId);
      } catch (dbErr) {
        console.error('[ModelsPage] Failed to save model to database:', dbErr);
        // Still add to store even if database save fails
        useStore.getState().addModel(newModel);
      }
    }
  });

  // Handler for deleting a model
  const handleDeleteModel = useEffectEvent((modelId: string) => {
    const model = useStore.getState().models.find((m) => m.id === modelId);
    if (!model) {
      console.error('[ModelsPage] Model not found:', modelId);
      return;
    }

    // Remove from store
    useStore.getState().removeModel(modelId);

    // Remove from database (non-blocking)
    try {
      deleteModel(parseInt(modelId, 10));
      console.log('[ModelsPage] Deleted model from database:', modelId);
    } catch (dbErr) {
      console.error('[ModelsPage] Failed to delete model from database:', dbErr);
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
              sx={{ mr: 2 }}
              onClick={() => console.log('Add new model')}
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
          {models.map((model) => (
            <Grid key={model.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card
                sx={{
                  height: '100%',
                  background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
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
                            background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(model.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={normalizeStatus(model.status) === 'running' ? 100 : normalizeStatus(model.status) === 'loading' ? 50 : 0}
                    color={getStatusColor(model.status) as 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'inherit'}
                    sx={{ height: '4px', borderRadius: '2px', mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
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
          ))}
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
        
        {/* Empty state */}
        {models.length === 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8, 
            border: `2px dashed ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
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
              sx={{ mt: 3 }}
              onClick={() => console.log('Add new model')}
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
