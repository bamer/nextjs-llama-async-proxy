"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { Card, CardContent, Typography, Box, Grid } from "@mui/material";
import { loadModelTemplates, saveModelTemplate } from '@/lib/client-model-templates';
import { useStore } from '@/lib/store';
import type { AppStore } from '@/lib/store/types';
import { ModelCard, type UnifiedModelData } from '@/components/ui/ModelCard';

interface ModelsListCardProps {
  models: UnifiedModelData[];
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

  const computeModelsHash = useCallback((models: UnifiedModelData[]): string => {
    return models.map(m => `${m.name}:${m.availableTemplates?.join(',')}`).join('|');
  }, []);

  const [selectedTemplates, setSelectedTemplates] = useState<Record<string, string>>({});

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
    } catch (error) {
      console.error('Failed to save template to config file:', error);
      alert(error instanceof Error ? error.message : 'Failed to save template');
    }
  };

  const handleToggleModelOptimistic = useCallback((modelId: string, status: string) => {
    setOptimisticStatus((prev: Record<string, string>) => ({ ...prev, [modelId]: status }));
  }, []);

  const handleMenu = useCallback((action: string) => {
    console.log('Menu action:', action);
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
          {models?.map((model) => (
            <Grid key={model.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <ModelCard
                model={model as UnifiedModelData}
                isDark={isDark}
                loading={loadingModels[model.id]}
                onStart={() => onToggleModel(model.id)}
                onStop={() => onToggleModel(model.id)}
                onMenu={handleMenu}
              />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
