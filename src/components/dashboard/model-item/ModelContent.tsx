"use client";

import { memo } from "react";
import { Box, Grid, Chip, Typography } from "@mui/material";
import { detectModelType } from "../model-item-utils";
import type { ModelConfig } from "../hooks/useModelItemHandlers";

export type DisplayStatusColor = 'default' | 'error' | 'primary' | 'secondary' | 'info' | 'success' | 'warning';

export interface ModelContentProps {
  model: ModelConfig;
  isDark: boolean;
  displayStatus: string;
  displayStatusColor: DisplayStatusColor;
  progressElement?: React.ReactNode;
  templateSelectElement: React.ReactNode;
  actionsElement: React.ReactNode;
}

export const ModelContent = memo(({
  model,
  isDark,
  displayStatus,
  displayStatusColor,
  progressElement,
  templateSelectElement,
  actionsElement,
}: ModelContentProps) => {
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

ModelContent.displayName = 'ModelContent';
