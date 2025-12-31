"use client";

import React from "react";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import { PlayArrow, Stop } from "@mui/icons-material";

export interface ModelActionsProps {
  status: string;
  loading: boolean;
  isRunning: boolean;
  templateAvailable: boolean;
  currentTemplate: string;
  onToggleModel: () => Promise<void>;
  onSaveTemplate: () => void;
}

export const ModelActions: React.FC<ModelActionsProps> = ({
  status,
  loading,
  isRunning,
  templateAvailable,
  currentTemplate,
  onToggleModel,
  onSaveTemplate
}) => {
  const isDisabled = loading || status === "loading";

  return (
    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
      <Button
        variant={isRunning ? "outlined" : "contained"}
        color={isRunning ? "error" : "primary"}
        onClick={onToggleModel}
        disabled={isDisabled}
        startIcon={isRunning ? <Stop /> : <PlayArrow />}
        fullWidth
        size="small"
      >
        {isRunning ? "Stop" : "Start"}
      </Button>

      {isRunning && templateAvailable && (
        <Tooltip title={`Selected: ${currentTemplate}`}>
          <Button
            variant="outlined"
            color="info"
            size="small"
            onClick={onSaveTemplate}
            sx={{ minWidth: 36, p: 0 }}
          >
            <Typography variant="caption" sx={{ fontSize: "14px" }}>
              💾
            </Typography>
          </Button>
        </Tooltip>
      )}
    </Box>
  );
};
