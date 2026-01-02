"use client";

import { Button, Tooltip, Typography, Box } from "@mui/material";
import { PlayArrow, Stop } from "@mui/icons-material";

interface ModelItemActionsProps {
  displayStatus: string;
  isLoading: boolean;
  currentTemplate: string;
  hasTemplates: boolean;
  onStartStop: () => void;
  onSaveTemplate: () => void;
}

export const ModelItemActions = ({
  displayStatus,
  isLoading,
  currentTemplate,
  hasTemplates,
  onStartStop,
  onSaveTemplate,
}: ModelItemActionsProps) => {
  return (
    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
      <Button
        variant={displayStatus === "running" ? "outlined" : "contained"}
        color={displayStatus === "running" ? "error" : "primary"}
        onClick={onStartStop}
        disabled={isLoading || displayStatus === "loading"}
        startIcon={displayStatus === "running" ? <Stop /> : <PlayArrow />}
        fullWidth
        size="small"
      >
        {displayStatus === "running" ? "Stop" : "Start"}
      </Button>

      {displayStatus === "running" && hasTemplates && (
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
