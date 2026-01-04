"use client";

import React from "react";
import { Grid, Box, Typography, Alert } from "@mui/material";
import { Settings as SettingsIcon } from "@mui/icons-material";
import { m } from "framer-motion";
import { FormSection } from "@/components/ui/FormSection";
import { FormField } from "@/components/ui/FormField";
import FormSwitch from "@/components/ui/FormSwitch";
import { useTheme } from "@/contexts/ThemeContext";

interface GeneralSettingsTabProps {
  formConfig: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fieldErrors: Record<string, string>;
}

export function GeneralSettingsTab({
  formConfig,
  onInputChange,
  fieldErrors,
}: GeneralSettingsTabProps): React.ReactNode {
  const { isDark } = useTheme();

  const handleChange = (name: string, value: string | number | boolean) => {
    onInputChange({ target: { name, value } } as any);
  };

  const handleSwitchChange = (name: string) => (_e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    onInputChange({ target: { name, value: checked } } as any);
  };

  const logLevelOptions = [
    { value: "debug", label: "Debug" },
    { value: "info", label: "Info" },
    { value: "warn", label: "Warning" },
    { value: "error", label: "Error" },
  ];

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      {formConfig.maxConcurrentModels === 1 && (
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body2">
            <strong>Single Model Mode:</strong> Only one model can be loaded at a time.
            Loading a new model will require stopping the currently running one first.
            Change "Max Concurrent Models" to a higher value for parallel loading.
          </Typography>
        </Alert>
      )}

      <FormSection title="General Settings" icon={<SettingsIcon />}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            label="Base Path"
            name="baseModelsPath"
            value={formConfig.baseModelsPath || ""}
            onChange={handleChange}
            helperText={fieldErrors.baseModelsPath || "Path to your models directory"}
            error={fieldErrors.baseModelsPath}
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            label="Log Level"
            name="logLevel"
            type="select"
            value={formConfig.logLevel}
            onChange={handleChange}
            options={logLevelOptions}
            helperText={fieldErrors.logLevel || "Logging verbosity level"}
            error={fieldErrors.logLevel}
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            label="Max Concurrent Models"
            name="maxConcurrentModels"
            type="number"
            value={formConfig.maxConcurrentModels || 1}
            onChange={handleChange}
            helperText={
              fieldErrors.maxConcurrentModels ||
              (formConfig.maxConcurrentModels === 1
                ? "Single model mode: Only one model loaded at a time"
                : "Parallel mode: Multiple models can be loaded simultaneously")
            }
            error={fieldErrors.maxConcurrentModels}
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box>
            <FormSwitch
              label="Auto Update"
              checked={formConfig.autoUpdate}
              onChange={handleSwitchChange("autoUpdate")}
              helperText="Automatically update models and dependencies"
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box>
            <FormSwitch
              label="Notifications Enabled"
              checked={formConfig.notificationsEnabled}
              onChange={handleSwitchChange("notificationsEnabled")}
              helperText="Receive system alerts and notifications"
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <FormField
            label="Llama-Server Path"
            name="llamaServerPath"
            value={formConfig.llamaServerPath || ""}
            onChange={handleChange}
            helperText={fieldErrors.llamaServerPath || "Path to llama-server executable"}
            error={fieldErrors.llamaServerPath}
            fullWidth
          />
        </Grid>
      </FormSection>
    </m.div>
  );
}
