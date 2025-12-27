"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Grid, Chip, LinearProgress, Button, TextField, MenuItem, Select, InputLabel, FormControl, Tooltip } from "@mui/material";
import { PlayArrow, Stop, MoreVert } from "@mui/icons-material";
import { loadModelTemplates, saveModelTemplate, getModelTemplate, getModelTemplates } from '@/lib/model-templates';
import { useStore } from '@/lib/store';

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

const STORAGE_KEY = 'selected-templates';

export function ModelsListCard({ models, isDark, onToggleModel }: ModelsListCardProps) {
  const [loadingModels, setLoadingModels] = useState<Record<string, boolean>>({});
  const [selectedTemplates, setSelectedTemplates] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<Record<string, string>>({});
  
  const modelsList = useStore((state) => state.models);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSelectedTemplates(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved templates from localStorage:', e);
      }
    }
    
    const allTemplates = getModelTemplates();
    const templatesForModels: Record<string, string> = {};
    modelsList.forEach(model => {
      if (model.availableTemplates && model.availableTemplates.length > 0) {
        templatesForModels[model.name] = model.availableTemplates[0];
      }
    });
    setTemplates(templatesForModels);
  }, [modelsList]);

  const saveSelectedTemplate = (modelName: string, template: string | null) => {
    setSelectedTemplates(prev => {
      const updated = { ...prev };
      if (template === null) {
        delete updated[modelName];
      } else {
        updated[modelName] = template;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const saveTemplateToConfigFile = (modelName: string, template: string) => {
    saveModelTemplate(modelName, template);
    const currentTemplates = getModelTemplates();
    const templatesObj = { ...currentTemplates };
    templatesObj[modelName] = template;
    const config = { model_templates: templatesObj };
    try {
      fetch('/api/model-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
    } catch (error) {
      console.error('Failed to save template to config file:', error);
    }
  };

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

  const getModelTypeTemplates = (modelType: 'llama' | 'mistral'): string[] => {
    const allTemplates = getModelTemplates();
    return Object.values(allTemplates).filter(t => {
      if (modelType === 'llama') {
        const t = t.toLowerCase();
        return t.includes('llama') || t.includes('chat') || t.includes('instruct');
      }
      return t.toLowerCase().includes('mistral');
    });
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

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {models?.map((model) => {
            const modelType = detectModelType(model.name);
            const typeTemplates = getModelTypeTemplates(modelType);
            const currentTemplate = selectedTemplates[model.name] || model.template || (typeTemplates[0] || '');
            
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={model.id}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={modelType.toUpperCase()}
                        color={modelType === 'llama' ? 'success' : modelType === 'mistral' ? 'primary' : 'default'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                      <Typography variant="subtitle2" fontWeight="bold">
                        {model.name}
                      </Typography>
                    </Box>
                    <Chip
                      label={getStatusLabel(model.status)}
                      color={getStatusColor(model.status)}
                      size="small"
                    />
                  </Box>

                  {model.status === 'loading' && model.progress !== undefined && (
                    <LinearProgress
                      variant="determinate"
                      value={model.progress}
                      sx={{ height: 4, borderRadius: 2, mb: 1 }}
                    />
                  )}

                  {model.availableTemplates && model.availableTemplates.length > 0 && model.status !== 'running' && (
                    <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                      <InputLabel>Template</InputLabel>
                      <Select
                        value={currentTemplate}
                        onChange={(e) => {
                          const template = e.target.value as string;
                          saveSelectedTemplate(model.name, template);
                        }}
                        size="small"
                      >
                        <MenuItem value="">
                          <em>Default</em>
                        </MenuItem>
                        {model.availableTemplates.map((template: string) => (
                          <MenuItem key={template} value={template}>
                            {template}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      variant={model.status === 'running' ? 'outlined' : 'contained'}
                      color={model.status === 'running' ? 'error' : 'primary'}
                      onClick={() => handleStartStop(model)}
                      disabled={loadingModels[model.id] || model.status === 'loading'}
                      startIcon={model.status === 'running' ? <Stop /> : <PlayArrow />}
                      fullWidth
                      size="small"
                    >
                      {model.status === 'running' ? 'Stop' : 'Start'}
                    </Button>

                    {model.status === 'running' && model.availableTemplates && model.availableTemplates.length > 0 && (
                      <Tooltip title={`Selected: ${currentTemplate}`}>
                        <Button
                          variant="outlined"
                          color="info"
                          size="small"
                          onClick={() => saveTemplateToConfigFile(model.name, currentTemplate)}
                          sx={{ minWidth: 36, p: 0 }}
                        >
                          <Typography variant="caption" sx={{ fontSize: '14px' }}>
                            💾
                          </Typography>
                        </Button>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}
