"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { Card, CardContent, Typography, Box, Grid, Chip, LinearProgress, Button, IconButton } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import { PlayArrow, Stop, Refresh, Add } from "@mui/icons-material";
import { websocketServer } from "@/lib/websocket-client";

export default function ModelsPage() {
  const models = useStore((state) => state.models);
  const { isDark } = useTheme();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Connect to WebSocket to receive model updates
    websocketServer.connect();

    const handleModels = (message: { type: string; data: any[] }) => {
      if (message.type === 'models' && message.data) {
        useStore.getState().setModels(message.data);
      }
    };

    const handleConnect = () => {
      // Request initial models when connected
      websocketServer.requestModels();
    };

    websocketServer.on('message', handleModels);
    websocketServer.on('connect', handleConnect);

    return () => {
      websocketServer.off('message', handleModels);
      websocketServer.off('connect', handleConnect);
    };
  }, []);

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

  const handleStartModel = async (modelId: string) => {
    // Find the model to get its name
    const model = models.find((m) => m.id === modelId);
    if (!model) {
      setError(`Model ${modelId} not found`);
      return;
    }

    setLoading(modelId);
    setError(null);
    
    try {
      useStore.getState().updateModel(modelId, { status: 'loading' });
      
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
      useStore.getState().updateModel(modelId, { status: 'running' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      useStore.getState().updateModel(modelId, { status: 'idle' });
    } finally {
      setLoading(null);
    }
  };

  const handleStopModel = async (modelId: string) => {
    // Find the model to get its name
    const model = models.find((m) => m.id === modelId);
    if (!model) {
      setError(`Model ${modelId} not found`);
      return;
    }

    setLoading(modelId);
    setError(null);
    
    try {
      useStore.getState().updateModel(modelId, { status: 'loading' });
      
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
      useStore.getState().updateModel(modelId, { status: 'idle' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      useStore.getState().updateModel(modelId, { status: 'running' });
    } finally {
      setLoading(null);
    }
  };

  const handleRefresh = () => {
    console.log('Refreshing models list');
    // In a real app, this would fetch fresh data from the server
  };

  return (
    <MainLayout>
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
              sx={{ 
                background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(13, 158, 248, 0.1)',
                '&:hover': {
                  background: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(13, 158, 248, 0.2)'
                }
              }}
            >
              <Refresh />
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
                    <Chip
                      label={normalizeStatus(model.status)}
                      color={getStatusColor(model.status) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                      size="small"
                      variant="filled"
                    />
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
    </MainLayout>
  );
}
