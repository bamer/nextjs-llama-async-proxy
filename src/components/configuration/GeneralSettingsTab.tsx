"use client";

import React from "react";
import {
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Box,
  Typography,
  Alert,
} from "@mui/material";
import { Settings as SettingsIcon } from "@mui/icons-material";
import { m } from "framer-motion";
import { FormSection } from "@/components/ui/FormSection";
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
          <TextField
            fullWidth
            label="Base Path"
            name="basePath"
            value={formConfig.basePath}
            onChange={onInputChange}
            variant="outlined"
            helperText={fieldErrors.basePath || "Path to your models directory"}
            error={!!fieldErrors.basePath}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Log Level"
            name="logLevel"
            value={formConfig.logLevel}
            onChange={onInputChange}
            select
            SelectProps={{ native: true }}
            variant="outlined"
            helperText={fieldErrors.logLevel || "Logging verbosity level"}
            error={!!fieldErrors.logLevel}
          >
            {["debug", "info", "warn", "error"].map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Max Concurrent Models"
            name="maxConcurrentModels"
            type="number"
            value={formConfig.maxConcurrentModels || 1}
            onChange={onInputChange}
            variant="outlined"
            helperText={
              fieldErrors.maxConcurrentModels ||
              (formConfig.maxConcurrentModels === 1
                ? "Single model mode: Only one model loaded at a time"
                : "Parallel mode: Multiple models can be loaded simultaneously")
            }
            error={!!fieldErrors.maxConcurrentModels}
            InputProps={{ inputProps: { min: 1, max: 20 } }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formConfig.autoUpdate}
                  onChange={(e) =>
                    onInputChange({
                      target: {
                        name: "autoUpdate",
                        checked: e.target.checked,
                        type: "checkbox",
                      },
                    } as any)
                    }
                  name="autoUpdate"
                  color="primary"
                />
              }
              label="Auto Update"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Automatically update models and dependencies
            </Typography>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formConfig.notificationsEnabled}
                  onChange={(e) =>
                    onInputChange({
                      target: {
                        name: "notificationsEnabled",
                        checked: e.target.checked,
                        type: "checkbox",
                      },
                    } as any)
                    }
                  name="notificationsEnabled"
                  color="primary"
                />
              }
              label="Notifications Enabled"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Receive system alerts and notifications
            </Typography>
          </Box>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Llama-Server Path"
            name="llamaServerPath"
            value={formConfig.llamaServerPath || ""}
            onChange={onInputChange}
            variant="outlined"
            helperText={fieldErrors.llamaServerPath || "Path to llama-server executable"}
            error={!!fieldErrors.llamaServerPath}
          />
        </Grid>
      </FormSection>
    </m.div>
  );
}
