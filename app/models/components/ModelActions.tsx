"use client";

import { Button, Tooltip, Box } from "@mui/material";
import { Settings as SettingsIcon, PlayArrow, Stop } from "@mui/icons-material";
import { normalizeStatus } from "../utils/model-utils";

interface ModelActionsProps {
  modelId: string;
  status: string;
  loading: string | null;
  onStart: (modelId: string) => void;
  onStop: (modelId: string) => void;
  onConfigure: (model: import("../types").ModelData) => void;
  model: import("../types").ModelData;
}

export function ModelActions({
  modelId,
  status,
  loading,
  onStart,
  onStop,
  onConfigure,
  model,
}: ModelActionsProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 1,
        mt: 2,
      }}
    >
      <Tooltip title="Configure model parameters">
        <Button
          variant="contained"
          color="primary"
          startIcon={<SettingsIcon />}
          size="small"
          onClick={() => onConfigure(model)}
          sx={{
            minWidth: 80,
            "&:hover": {
              transform: "translateY(-1px)",
            },
          }}
        >
          Config
        </Button>
      </Tooltip>
      {normalizeStatus(status) === "running" ? (
        <Button
          variant="outlined"
          color="error"
          startIcon={<Stop />}
          size="small"
          disabled={loading === modelId}
          onClick={() => onStop(modelId)}
        >
          {loading === modelId ? "Stopping..." : "Stop"}
        </Button>
      ) : (
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlayArrow />}
          size="small"
          disabled={loading === modelId}
          onClick={() => onStart(modelId)}
        >
          {loading === modelId ? "Starting..." : "Start"}
        </Button>
      )}
    </Box>
  );
}
