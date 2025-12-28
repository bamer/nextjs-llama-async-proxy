"use client";

import { useState, useEffect, useRef, useMemo, useCallback, useTransition, useEffectEvent as ReactUseEffectEvent } from 'react';
import { Card, CardContent, Typography, Box, Grid } from "@mui/material";
import { loadModelTemplates, saveModelTemplate, getModelTemplates, getModelTemplatesSync } from '@/lib/client-model-templates';
import { useStore } from '@/lib/store';
import { MemoizedModelItem } from './MemoizedModelItem';
import { detectModelType, getModelTypeTemplates } from './MemoizedModelItem';
import { setItem, getItem, setItemLow } from '@/utils/local-storage-batch';

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
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const modelsList = useStore((state) => state.models);
  const templatesLoadedRef = useRef(false);
  const lastModelsHashRef = useRef('');

  // Compute hash of models for change detection
  const computeModelsHash = (models: ModelConfig[]): string => {
    return models.map(m => `${m.name}:${m.availableTemplates?.join(',')}`).join('|');
  };

  // Load saved templates from localStorage (only on mount)
  useEffect(() => {
    const saved = getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSelectedTemplates(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved templates from localStorage:', e);
      }
    }
  }, []);

  // Memoize templates for models to avoid unnecessary recalculations
  const templatesForModels = useMemo(() => {
    const result: Record<string, string> = {};
    modelsList.forEach(model => {
      if (model.availableTemplates && model.availableTemplates.length > 0) {
        result[model.name] = model.availableTemplates[0];
      }
    });
    return result;
  }, [modelsList]);

  // Create stable callbacks for useEffect dependencies
  const loadTemplatesWhenModelsChange = ReactUseEffectEvent(() => {
    const currentModelsHash = computeModelsHash(modelsList);
    const shouldLoad = !templatesLoadedRef.current || currentModelsHash !== lastModelsHashRef.current;

    if (shouldLoad) {
      startTransition(async () => {
        await loadModelTemplates();
        // Use current value from templatesForModels memo, not in dependency array
        setTemplates(templatesForModels);
        templatesLoadedRef.current = true;
        lastModelsHashRef.current = currentModelsHash;
      });
    }
  });

  const clearOptimisticStatus = ReactUseEffectEvent(() => {
    setOptimisticStatus((prev: Record<string, string>) => {
      const updated: Record<string, string> = {};
      Object.keys(prev).forEach(modelId => {
        const model = modelsList.find(m => m.id === modelId);
        // Keep optimistic status only if model is still loading
        // Once model reaches terminal state (running/stopped/idle/error), clear optimistic override
        if (model && model.status === 'loading') {
          updated[modelId] = prev[modelId];
        }
        // If model doesn't exist or is not loading, let actual status show
      });
      return updated;
    });
  });

  // Load templates only when models actually change (not on every render)
  // Using useEffectEvent for callbacks so effect only depends on modelsList
  useEffect(() => {
    loadTemplatesWhenModelsChange();
  }, [modelsList, loadTemplatesWhenModelsChange]);

  // Clear optimistic status when models update via WebSocket
  // Using useEffectEvent for callbacks so effect only depends on modelsList
  useEffect(() => {
    clearOptimisticStatus();
  }, [modelsList, clearOptimisticStatus]);

  // Debounced localStorage write using batch storage utility
  const saveSelectedTemplate = (modelName: string, template: string | null) => {
    setSelectedTemplates(prev => {
      const updated = { ...prev };
      if (template === null) {
        delete updated[modelName];
      } else {
        updated[modelName] = template;
      }

      // Batch localStorage write using requestIdleCallback under the hood
      setItem(STORAGE_KEY, JSON.stringify(updated));

      return updated;
    });
  };

  const saveTemplateToConfigFile = async (modelName: string, template: string) => {
    try {
      await saveModelTemplate(modelName, template);
      // Update local cache
      const currentTemplates = getModelTemplatesSync();
      currentTemplates[modelName] = template;
      setTemplates({ ...currentTemplates });
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
            const typeTemplates: string[] = getModelTypeTemplates(modelType);
            const currentTemplate = selectedTemplates[model.name] || model.template || (typeTemplates?.[0] || '');

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
