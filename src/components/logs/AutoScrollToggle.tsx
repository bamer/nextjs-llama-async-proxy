"use client";

import { IconButton, Tooltip } from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";
import SyncDisabledIcon from "@mui/icons-material/SyncDisabled";

interface AutoScrollToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function AutoScrollToggle({ enabled, onToggle }: AutoScrollToggleProps) {
  return (
    <Tooltip title={enabled ? "Disable auto-scroll" : "Enable auto-scroll"}>
      <IconButton onClick={onToggle} size="small">
        {enabled ? (
          <>
            <SyncIcon
              sx={{
                animation: "spin 1s linear infinite",
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            />
            <span
              style={{
                position: "absolute",
                width: 8,
                height: 8,
                backgroundColor: "#22c55e",
                borderRadius: "50%",
                bottom: 4,
                right: 4,
                border: "1px solid white",
              }}
            />
          </>
        ) : (
          <SyncDisabledIcon />
        )}
      </IconButton>
    </Tooltip>
  );
}
