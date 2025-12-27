"use client";

import { useState } from 'react';
import { Card, CardContent, Typography, Box, Grid, Chip, LinearProgress, Button, TextField, MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import { PlayArrow, Stop, MoreVert } from "@mui/icons-material";

interface ModelConfig {
  id: string;
  name: string;
  status: 'idle' | 'loading' | 'running' | 'error';
  type: "llama" | "mistral" | "other";
  progress?: number;
  template?: string;
  availableTemplates?: string[];
}

interface ModelsListCardProps {
  models: ModelConfig[];
  isDark: boolean;
  onToggleModel: (modelId: string) => void;
}

export function ModelsListCard({ models, isDark, onToggleModel }: ModelsListCardProps) {
  const [loadingModels, setLoadingModels] = useState<Record<string, boolean>>({});
  const [selectedTemplates, setSelectedTemplates] = useState<Record<string, string>>({});

  const detectModelType = (modelName: string): 'llama' | 'mistral' | 'other' => {
    const nameLower = modelName.toLowerCase();
    if (nameLower.includes('llama') || nameLower.includes('codellama') || nameLower.includes('gemma') || nameLower.includes('granite')) {
      return 'llama';
    }
    if (nameLower.includes('mistral') || nameLower.includes('qwen') || nameLower.includes('nemotron') || nameLower.includes('magnus') || nameLower.includes('fluently')) {
      return 'mistral';
    }
    return 'other';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'running': return 'success';
      case 'loading': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'running': return 'RUNNING';
      case 'loading': return 'LOADING';
      case 'error': return 'ERROR';
      default: return 'STOPPED';
    }
  };

  const handleStartStop = async (model: ModelConfig) => {
    if (loadingModels[model.id]) return;

    setLoadingModels(prev => ({ ...prev, [model.id]: true }));

    try {
      if (model.status === 'running') {
        await fetch(`/api/models/${encodeURIComponent(model.name)}/stop`, { method: 'POST' });
      } else {
        const selectedTemplate = selectedTemplates[model.name] || model.template;
        const body: any = {};
        if (selectedTemplate) {
          body.template = selectedTemplate;
        }

        const response = await fetch(`/api/models/${encodeURIComponent(model.name)}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to start model');
      }
      onToggleModel(model.id);
    } catch (error) {
      console.error('Failed to toggle model:', error);
      alert(error instanceof Error ? error.message : 'Failed to start model');
    } finally {
      setLoadingModels(prev => ({ ...prev, [model.id]: false }));
    }
  };

  return (
    <Card sx={{
      background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      height: '100%',
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Available Models
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {models?.length || 0} models
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {(models || []).map((model) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={model.id}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
                      {model.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {detectModelType(model.name)}
                      </Typography>
                      {model.status === 'running' && (
                        <Chip
                          label="LOADED"
                          size="small"
                          color="success"
                          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, ml: 0.5 }}
                        />
                      )}
                    </Box>
                  </Box>
                  <Chip
                    label={getStatusLabel(model.status)}
                    size="small"
                    color={getStatusColor(model.status) as any}
                    sx={{ height: 24, fontWeight: 600 }}
                  />
                </Box>

                {model.status === 'loading' && model.progress !== undefined && (
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={model.progress}
                      sx={{ height: '4px', borderRadius: '2px' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Loading... {model.progress.toFixed(0)}%
                    </Typography>
                  </Box>
                )}

                {model.availableTemplates && model.availableTemplates.length > 0 && model.status !== 'running' && (
                  <Box sx={{ mt: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel shrink sx={{ fontSize: '0.75rem' }}>Template</InputLabel>
                      <Select
                        value={selectedTemplates[model.name] || model.template || ''}
                        onChange={(e) => setSelectedTemplates(prev => ({ ...prev, [model.name]: e.target.value as string }))}
                        label="Template"
                        size="small"
                        sx={{
                          '& .MuiSelect-select': {
                            fontSize: '0.85rem',
                            padding: '8px',
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>Default</em>
                        </MenuItem>
                        {model.availableTemplates.map((template) => (
                          <MenuItem key={template} value={template}>
                            {template}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}

                {model.template && model.status === 'running' && (
                  <Chip
                    label={`Template: ${model.template}`}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 1, fontSize: '0.7rem', height: 20 }}
                  />
                )}

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button
                    size="small"
                    variant={model.status === 'running' ? 'outlined' : 'contained'}
                    color={model.status === 'running' ? 'error' : 'primary'}
                    startIcon={model.status === 'running' ? <Stop /> : <PlayArrow />}
                    onClick={() => handleStartStop(model)}
                    disabled={model.status === 'loading' || loadingModels[model.id]}
                    sx={{ flex: 1 }}
                  >
                    {loadingModels[model.id] ? (model.status === 'running' ? 'Stopping...' : 'Starting...') : (model.status === 'running' ? 'Stop' : 'Start')}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ minWidth: 40 }}
                  >
                    <MoreVert />
                  </Button>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
