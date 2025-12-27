'use client';

import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Box,
  Alert,
} from "@mui/material";
import { m } from "framer-motion";
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
      <Card
        sx={{
          mb: 4,
          background: isDark
            ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
          boxShadow: isDark
            ? "0 8px 30px rgba(0, 0, 0, 0.3)"
            : "0 8px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <CardContent>
          <Typography variant="h5" fontWeight="bold" mb={4}>
            General Settings
          </Typography>

          {formConfig.maxConcurrentModels === 1 && (
            <Alert severity="info" sx={{ mb: 4 }}>
              <Typography variant="body2">
                <strong>Single Model Mode:</strong> Only one model can be loaded at a time.
                Loading a new model will require stopping the currently running one first.
                Change "Max Concurrent Models" to a higher value for parallel loading.
              </Typography>
            </Alert>
          )}

          <Grid container spacing={4}>
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
                sx={{ mb: 3 }}
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
                sx={{ mb: 3 }}
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
                sx={{ mb: 3 }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
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
                sx={{ mb: 3 }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ ml: 0, mb: 3 }}
              >
                Automatically update models and dependencies
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
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
                sx={{ mb: 3 }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ ml: 0, mb: 3 }}
              >
                Receive system alerts and notifications
              </Typography>
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
                sx={{ mb: 3 }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </m.div>
  );
}
