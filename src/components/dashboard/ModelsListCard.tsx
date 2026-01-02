"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { Card, CardContent, Typography, Box, Grid } from "@mui/material";
import { loadModelTemplates, saveModelTemplate } from '@/lib/client-model-templates';
import { useStore } from '@/lib/store';
import type { AppStore } from '@/lib/store/types';
import { MemoizedModelItem } from './MemoizedModelItem';
import { detectModelType, getModelTypeTemplates } from './MemoizedModelItem';

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
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, string>>({});
  const startTransition = useTransition()[1];

  const modelsList = useStore((state: AppStore) => state.models);
  const templatesLoadedRef = useRef(false);
  const lastModelsHashRef = useRef('');
  const isInitializedRef = useRef(false);

  // Compute hash of models for change detection
  const computeModelsHash = useCallback((models: ModelConfig[]): string => {
    return models.map(m => `${m.name}:${m.availableTemplates?.join(',')}`).join('|');
  }, []);

  // Selected templates stored in memory only
  const [selectedTemplates, setSelectedTemplates] = useState<Record<string, string>>({});

  // Load model templates when models list changes (after initialization)
  // Skip initial render to avoid hydration issues
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }

    const currentModelsHash = computeModelsHash(modelsList);
    const shouldLoadTemplates = !templatesLoadedRef.current || currentModelsHash !== lastModelsHashRef.current;

    if (shouldLoadTemplates) {
      startTransition(async () => {
        await loadModelTemplates();
        templatesLoadedRef.current = true;
        lastModelsHashRef.current = currentModelsHash;
      });
    }
  }, [computeModelsHash, startTransition, modelsList]);

  const saveSelectedTemplate = (modelName: string, template: string | null) => {
    setSelectedTemplates(prev => {
      const updated = { ...prev };
      if (template === null) {
        delete updated[modelName];
      } else {
        updated[modelName] = template;
      }

      return updated;
    });
  };

  const saveTemplateToConfigFile = async (modelName: string, template: string) => {
    try {
      await saveModelTemplate(modelName, template);
      // The config is saved to disk, no need for local state cache
    } catch (error) {
      console.error('Failed to save template to config file:', error);
      alert(error instanceof Error ? error.message : 'Failed to save template');
    }
  };

  const handleToggleModelOptimistic = useCallback((modelId: string, status: string) => {
    setOptimisticStatus((prev: Record<string, string>) => ({ ...prev, [modelId]: status }));
  }, []);

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
            const currentTemplate = selectedTemplates[model.name] || model.template || (model.availableTemplates?.[0] || '');

            return (
              <MemoizedModelItem
                key={model.id}
                model={model}
                isDark={isDark}
                currentTemplate={currentTemplate}
                loadingModels={loadingModels}
                setLoadingModels={setLoadingModels}
                selectedTemplates={selectedTemplates}
                onSaveTemplate={saveSelectedTemplate}
                onSaveTemplateToConfig={saveTemplateToConfigFile}
                onToggleModel={onToggleModel}
                onToggleModelOptimistic={handleToggleModelOptimistic}
                optimisticStatus={optimisticStatus[model.id]}
              />
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}
