"use client";

import React from "react";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SettingsIcon from "@mui/icons-material/Settings";
import { useTheme } from "@/contexts/ThemeContext";

interface ConfigurationHeaderProps {
  title?: string;
  onBack?: () => void;
  onSave?: () => void;
  showBackButton?: boolean;
  showSaveButton?: boolean;
}

export function ConfigurationHeader({
  title = "Configuration",
  onBack,
  onSave,
  showBackButton = true,
  showSaveButton = true,
}: ConfigurationHeaderProps): React.ReactNode {
  const { isDark } = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 4,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {showBackButton && onBack && (
          <Tooltip title="Back">
            <IconButton
              onClick={onBack}
              sx={{
                color: isDark ? "text.primary" : "text.primary",
                "&:hover": {
                  backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <SettingsIcon
            sx={{
              fontSize: 32,
              color: "primary.main",
            }}
          />
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              color: isDark ? "text.primary" : "text.primary",
            }}
          >
            {title}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {showSaveButton && onSave && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              px: 2,
              py: 1,
              borderRadius: 1,
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
            }}
          >
            Use the actions below to save your changes
          </Typography>
        )}
      </Box>
    </Box>
  );
}
