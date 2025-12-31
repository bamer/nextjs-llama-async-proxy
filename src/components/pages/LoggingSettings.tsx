"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { useWebSocket } from "@/hooks/use-websocket";
import { useLoggerConfig, type LoggerConfig } from "@/hooks/use-logger-config";
import { Box, Typography, Grid, Divider } from "@mui/material";
import { m } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import ConsoleLoggingSection from "./logging/ConsoleLoggingSection";
import FileLoggingSection from "./logging/FileLoggingSection";
import LoggingActions from "./logging/LoggingActions";
import LoggingPreview from "./logging/LoggingPreview";

export default function LoggingSettings() {
  const { isDark } = useTheme();
  const { sendMessage } = useWebSocket();
  const { loggerConfig, updateConfig, resetConfig, loading, applyToLogger } =
    useLoggerConfig();

  const handleConfigChange = (
    key: keyof LoggerConfig,
    value: string | boolean
  ) => {
    updateConfig({ [key]: value });
  };

  const handleSaveConfig = () => {
    try {
      sendMessage("updateLoggerConfig", loggerConfig);

      applyToLogger();

      useStore.getState().setLoading(false);
      useStore.getState().clearError();

      console.log("Logging configuration updated successfully");
    } catch (error) {
      console.error("Failed to update logging configuration:", error);
      useStore.getState().setError("Failed to update logging configuration");
    }
  };

  const handleResetConfig = () => {
    resetConfig();
    sendMessage("updateLoggerConfig", loggerConfig);
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Loading Logging Configuration...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h3" component="h1" fontWeight="bold">
            Logging Configuration
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Advanced Logging System with File Rotation
          </Typography>
        </m.div>
      </Box>

      <Divider
        sx={{
          my: 4,
          borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        }}
      />

      {/* Logging Configuration Cards */}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ConsoleLoggingSection
            config={loggerConfig}
            onChange={handleConfigChange}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FileLoggingSection config={loggerConfig} onChange={handleConfigChange} />
        </Grid>
      </Grid>

      <Box sx={{ mt: 6 }} />

      {/* Actions */}
      <LoggingActions
        onSave={handleSaveConfig}
        onReset={handleResetConfig}
        loading={loading}
        hasChanges={false}
      />

      <Box sx={{ mt: 4 }} />

      {/* Current Configuration */}
      <LoggingPreview config={loggerConfig} />
    </Box>
  );
}
