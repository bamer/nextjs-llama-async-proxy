"use client";

import { Box, Toolbar, Typography, IconButton, Chip } from "@mui/material";
import { Close as CloseIcon, Settings as SettingsIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

interface SidebarHeaderProps {
  modelId: number | undefined;
  hasChanges: boolean;
  onClose: () => void;
}

export const SidebarHeader = ({ modelId, hasChanges, onClose }: SidebarHeaderProps) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 2,
        backgroundColor: theme.palette.mode === "dark" ? "primary.dark" : "primary.main",
        color: theme.palette.primary.contrastText,
      }}
    >
      <Toolbar disableGutters sx={{ minHeight: "auto", px: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
          <SettingsIcon fontSize="medium" />
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
            Model Configuration
          </Typography>
          {modelId && (
            <Chip
              label={`ID: ${modelId}`}
              size="small"
              sx={{
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "inherit",
                fontSize: "0.75rem",
              }}
            />
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {hasChanges && (
            <Typography
              variant="caption"
              sx={{
                color: "warning.light",
                fontWeight: 500,
              }}
            >
              Unsaved
            </Typography>
          )}
          <IconButton
            onClick={onClose}
            sx={{ color: "inherit" }}
            aria-label="Close configuration"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </Box>
  );
};
