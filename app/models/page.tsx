"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useStore } from "@/lib/store";
import { useEffect } from "react";
import { Card, CardContent, Typography, Box, Grid, Chip, LinearProgress, Button, IconButton } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import { PlayArrow, Stop, Refresh, Add } from "@mui/icons-material";

export default function ModelsPage() {
  const models = useStore((state) => state.models);
  const { isDark } = useTheme();
  
  // Mock data if no models available
  useEffect(() => {
    if (models.length === 0) {
      // This would typically come from an API or WebSocket
      // For now, we'll use mock data
      const mockModels = [
        {
          id: 'llama-7b',
          name: 'Llama 7B',
          type: 'llama',
          status: 'running',
          parameters: { temperature: 0.7, maxTokens: 2048, topP: 0.9 },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'llama-13b',
          name: 'Llama 13B',
          type: 'llama',
          status: 'stopped',
          parameters: { temperature: 0.6, maxTokens: 4096, topP: 0.8 },
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      
      // Update store with mock models
      useStore.getState().setModels(mockModels);
    }
  }, [models.length]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'success';
      case 'loading': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const handleStartModel = (modelId: string) => {
    // This would typically send a WebSocket message
    console.log('Starting model:', modelId);
    useStore.getState().updateModel(modelId, { status: 'loading' });
    
    // Simulate loading and then running state
    setTimeout(() => {
      useStore.getState().updateModel(modelId, { status: 'running' });
    }, 2000);
  };

  const handleStopModel = (modelId: string) => {
    // This would typically send a WebSocket message
    console.log('Stopping model:', modelId);
    useStore.getState().updateModel(modelId, { status: 'stopped' });
  };

  const handleRefresh = () => {
    console.log('Refreshing models list');
    // In a real app, this would fetch fresh data from the server
  };

  return (
    <MainLayout>
      <Box sx={{ p: 4 }}>
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
            <Grid item key={model.id} xs={12} sm={6} md={4} lg={3}>
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
                      label={model.status}
                      color={getStatusColor(model.status) as any}
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
                    value={model.status === 'running' ? 100 : model.status === 'loading' ? 50 : 0}
                    color={getStatusColor(model.status) as any}
                    sx={{ height: '4px', borderRadius: '2px', mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    {model.status === 'running' ? (
                      <Button 
                        variant="outlined"
                        color="error"
                        startIcon={<Stop />}
                        size="small"
                        onClick={() => handleStopModel(model.id)}
                      >
                        Stop
                      </Button>
                    ) : (
                      <Button 
                        variant="contained"
                        color="primary"
                        startIcon={<PlayArrow />}
                        size="small"
                        onClick={() => handleStartModel(model.id)}
                      >
                        Start
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
