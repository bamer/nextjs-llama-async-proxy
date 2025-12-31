"use client";

import { Box, Button, ButtonGroup, Tooltip } from "@mui/material";
import { PlayArrow, Pause, Delete, Refresh } from "@mui/icons-material";
import { memo } from "react";

interface MonitoringActionsProps {
  onPause: () => void;
  onResume: () => void;
  onClear: () => void;
  onRefresh: () => void;
  isPaused?: boolean;
}

const MonitoringActions = memo(function MonitoringActions({
  onPause,
  onResume,
  onClear,
  onRefresh,
  isPaused = false
}: MonitoringActionsProps) {
  return (
    <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 4 }}>
      <ButtonGroup variant="outlined" size="small">
        <Tooltip title="Resume monitoring">
          <Button
            onClick={onResume}
            disabled={!isPaused}
            startIcon={<PlayArrow />}
            variant={isPaused ? "contained" : "outlined"}
            color="success"
          >
            Resume
          </Button>
        </Tooltip>

        <Tooltip title="Pause monitoring">
          <Button
            onClick={onPause}
            disabled={isPaused}
            startIcon={<Pause />}
            variant={!isPaused ? "contained" : "outlined"}
            color="warning"
          >
            Pause
          </Button>
        </Tooltip>
      </ButtonGroup>

      <Tooltip title="Clear all metrics data">
        <Button
          onClick={onClear}
          startIcon={<Delete />}
          variant="outlined"
          color="error"
          size="small"
        >
          Clear
        </Button>
      </Tooltip>

      <Tooltip title="Refresh metrics now">
        <Button
          onClick={onRefresh}
          startIcon={<Refresh />}
          variant="outlined"
          color="primary"
          size="small"
        >
          Refresh
        </Button>
      </Tooltip>
    </Box>
  );
});

MonitoringActions.displayName = "MonitoringActions";

export { MonitoringActions };
