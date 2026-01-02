"use client";

import { memo } from "react";
import { Box, Grid, Chip, LinearProgress, Button, MenuItem, Select, InputLabel, FormControl, Tooltip, Typography } from "@mui/material";
import { PlayArrow, Stop } from "@mui/icons-material";
import { detectModelType, getStatusColor } from "./model-item-utils";
import { useModelItemHandlers, type ModelConfig } from "./hooks/useModelItemHandlers";
import { modelItemMemoComparison } from "./utils/modelItemMemoComparison";

// Re-export utilities for backward compatibility
export { detectModelType, getModelTypeTemplates } from "./model-item-utils";

export type { ModelConfig };

export interface MemoizedModelItemProps {
  model: ModelConfig;
  isDark: boolean;
  currentTemplate: string;
  loadingModels: Record<string, boolean>;
  setLoadingModels: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  selectedTemplates: Record<string, string>;
  onSaveTemplate: (modelName: string, template: string | null) => void;
  onSaveTemplateToConfig: (modelName: string, template: string) => void;
  onToggleModel: (modelId: string) => void;
  onToggleModelOptimistic?: (modelId: string, status: string) => void;
  optimisticStatus?: string;
}

interface ModelItemActionsProps {
  displayStatus: string;
  loadingModels: Record<string, boolean>;
  model: ModelConfig;
  currentTemplate: string;
  onStartStop: () => void;
  handleSaveTemplate: () => void;
}

const ModelItemActions = memo(({
  displayStatus,
  loadingModels,
  model,
  currentTemplate,
  onStartStop,
  handleSaveTemplate,
}: ModelItemActionsProps) => (
  <Box sx={{ display: 'flex', gap:1, mt: 1 }}>
    <Button
      variant={displayStatus === 'running' ? 'outlined' : 'contained'}
      color={displayStatus === 'running' ? 'error' : 'primary'}
      onClick={onStartStop}
      disabled={loadingModels[model.id] || displayStatus === 'loading'}
      startIcon={displayStatus === 'running' ? <Stop /> : <PlayArrow />}
      fullWidth
      size="small"
    >
      {displayStatus === 'running' ? 'Stop' : 'Start'}
    </Button>

    {displayStatus === 'running' && model.availableTemplates &&
     model.availableTemplates.length > 0 && (
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
));

ModelItemActions.displayName = 'ModelItemActions';

interface ModelItemTemplateSelectProps {
  model: ModelConfig;
  currentTemplate: string;
  handleTemplateChange: (e: { target: { value: string } }) => void;
  displayStatus: string;
}

const ModelItemTemplateSelect = memo(({
  model,
  currentTemplate,
  handleTemplateChange,
  displayStatus,
}: ModelItemTemplateSelectProps) => {
  if (!model.availableTemplates || model.availableTemplates.length === 0 ||
      displayStatus === 'running') {
    return null;
  }

  return (
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
  );
});

ModelItemTemplateSelect.displayName = 'ModelItemTemplateSelect';

interface ModelItemContentProps {
  model: ModelConfig;
  isDark: boolean;
  displayStatus: string;
  displayStatusColor: 'default' | 'error' | 'primary' | 'secondary' | 'info' | 'success' | 'warning';
  progressElement?: React.ReactNode;
  templateSelectElement: React.ReactNode;
  actionsElement: React.ReactNode;
}

const ModelItemContent = memo(({
  model,
  isDark,
  displayStatus,
  displayStatusColor,
  progressElement,
  templateSelectElement,
  actionsElement,
}: ModelItemContentProps) => {
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
            label={displayStatus}
            color={displayStatusColor}
            size="small"
          />
        </Box>

        {progressElement}

        {templateSelectElement}

        {actionsElement}
      </Box>
    </Grid>
  );
});

ModelItemContent.displayName = 'ModelItemContent';

const MemoizedModelItem = memo(function ModelItem({
  model,
  isDark,
  currentTemplate,
  loadingModels,
  setLoadingModels,
  selectedTemplates,
  onSaveTemplate,
  onSaveTemplateToConfig,
  onToggleModel,
  onToggleModelOptimistic,
  optimisticStatus
}: MemoizedModelItemProps) {
  const displayStatus = optimisticStatus || model.status;
  const displayStatusColor = getStatusColor(displayStatus);

  const { handleStartStop, handleTemplateChange, handleSaveTemplate } =
    useModelItemHandlers({
      model,
      loadingModels,
      setLoadingModels,
      selectedTemplates,
      currentTemplate,
      onSaveTemplate,
      onSaveTemplateToConfig,
      onToggleModel,
      onToggleModelOptimistic,
    });

  const progressElement = displayStatus === 'loading' && model.progress !== undefined ? (
    <LinearProgress
      variant="determinate"
      value={model.progress}
      sx={{ height: 4, borderRadius: 2, mb: 1 }}
    />
  ) : undefined;

  const templateSelectElement = (
    <ModelItemTemplateSelect
      model={model}
      currentTemplate={currentTemplate}
      handleTemplateChange={handleTemplateChange}
      displayStatus={displayStatus}
    />
  );

  const actionsElement = (
    <ModelItemActions
      displayStatus={displayStatus}
      loadingModels={loadingModels}
      model={model}
      currentTemplate={currentTemplate}
      onStartStop={handleStartStop}
      handleSaveTemplate={handleSaveTemplate}
    />
  );

  return (
    <ModelItemContent
      model={model}
      isDark={isDark}
      displayStatus={displayStatus}
      displayStatusColor={displayStatusColor}
      progressElement={progressElement}
      templateSelectElement={templateSelectElement}
      actionsElement={actionsElement}
    />
  );
}, modelItemMemoComparison);

MemoizedModelItem.displayName = 'MemoizedModelItem';

export { MemoizedModelItem };
