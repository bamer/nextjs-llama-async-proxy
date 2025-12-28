"use client";

import { memo, useCallback } from "react";
import { Box, Grid, Chip, LinearProgress, Button, MenuItem, Select, InputLabel, FormControl, Tooltip, Typography } from "@mui/material";
import { PlayArrow, Stop } from "@mui/icons-material";
import { getModelTemplatesSync } from '@/lib/client-model-templates';

interface ModelConfig {
  id: string;
  name: string;
  status: 'idle' | 'loading' | 'running' | 'error';
  type: "llama" | "mistral" | "other";
  progress?: number;
  template?: string;
  availableTemplates?: string[];
}

interface MemoizedModelItemProps {
  model: ModelConfig;
  isDark: boolean;
  currentTemplate: string;
  loadingModels: Record<string, boolean>;
  selectedTemplates: Record<string, string>;
  onSaveTemplate: (modelName: string, template: string | null) => void;
  onSaveTemplateToConfig: (modelName: string, template: string) => void;
  onToggleModel: (modelId: string) => void;
}

// Exported helper function
export const detectModelType = (modelName: string): 'llama' | 'mistral' | 'other' => {
  const nameLower = modelName.toLowerCase();
  if (nameLower.includes('llama') || nameLower.includes('codellama') || nameLower.includes('gemma') || nameLower.includes('granite')) {
    return 'llama';
  }
  if (nameLower.includes('mistral') || nameLower.includes('qwen') || nameLower.includes('nemotron') || nameLower.includes('magnus') || nameLower.includes('fluently')) {
    return 'mistral';
  }
  return 'other';
};

// Exported helper function
export const getModelTypeTemplates = (modelType: 'llama' | 'mistral' | 'other'): string[] => {
  const allTemplates = getModelTemplatesSync();
  const templateValues = Object.values(allTemplates) as string[];
  if (modelType === 'other') {
    return templateValues;
  }
  return templateValues.filter(t => {
    const template = t.toLowerCase();
    if (modelType === 'llama') {
      return template.includes('llama') || template.includes('chat') || template.includes('instruct');
    }
    return template.includes('mistral');
  });
};

// Helper function defined outside component (created once)
const getStatusColor = (status: string): 'default' | 'error' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'running': return 'success';
    case 'loading': return 'warning';
    case 'error': return 'error';
    default: return 'default';
  }
};

// Helper function defined outside component (created once)
const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'running': return 'RUNNING';
    case 'loading': return 'LOADING';
    case 'error': return 'ERROR';
    default: return 'STOPPED';
  }
};

// Memoized individual model item component
const MemoizedModelItem = memo(function ModelItem({
  model,
  isDark,
  currentTemplate,
  loadingModels,
  selectedTemplates,
  onSaveTemplate,
  onSaveTemplateToConfig,
  onToggleModel
}: MemoizedModelItemProps) {
  // Memoize start/stop handler
  const handleStartStop = useCallback(async () => {
    if (loadingModels[model.id]) return;

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
    }
  }, [model.id, model.name, model.status, loadingModels, selectedTemplates, onToggleModel]);

  // Memoize template change handler
  const handleTemplateChange = useCallback((e: { target: { value: string } }) => {
    const template = e.target.value as string;
    onSaveTemplate(model.name, template);
  }, [model.name, onSaveTemplate]);

  // Memoize save template handler
  const handleSaveTemplate = useCallback(() => {
    onSaveTemplateToConfig(model.name, currentTemplate);
  }, [model.name, currentTemplate, onSaveTemplateToConfig]);

  // Compute model type and related properties
  const modelType = detectModelType(model.name);

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
              onChange={handleTemplateChange}
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
            onClick={handleStartStop}
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
                onClick={handleSaveTemplate}
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
}, (prevProps, nextProps) => {
  // Custom comparison for fine-grained control
  // Only re-render if critical model properties change
  const prevModel = prevProps.model;
  const nextModel = nextProps.model;

  return (
    prevProps.isDark === nextProps.isDark &&
    prevProps.currentTemplate === nextProps.currentTemplate &&
    prevProps.loadingModels[prevModel.id] === nextProps.loadingModels[nextModel.id] &&
    prevModel.id === nextModel.id &&
    prevModel.name === nextModel.name &&
    prevModel.status === nextModel.status &&
    prevModel.progress === nextModel.progress &&
    prevModel.availableTemplates?.length === nextModel.availableTemplates?.length
  );
});

MemoizedModelItem.displayName = 'MemoizedModelItem';

export { MemoizedModelItem };
