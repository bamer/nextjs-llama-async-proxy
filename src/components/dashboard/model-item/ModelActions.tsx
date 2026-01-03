"use client";

import { memo } from "react";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import { PlayArrow, Stop } from "@mui/icons-material";
import type { ModelConfig } from "../hooks/useModelItemHandlers";

export interface ModelActionsProps {
  displayStatus: string;
  loadingModels: Record<string, boolean>;
  model: ModelConfig;
  currentTemplate: string;
  onStartStop: () => void;
  handleSaveTemplate: () => void;
}

export const ModelActions = memo(({
  displayStatus,
  loadingModels,
  model,
  currentTemplate,
  onStartStop,
  handleSaveTemplate,
}: ModelActionsProps) => (
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

ModelActions.displayName = 'ModelActions';
