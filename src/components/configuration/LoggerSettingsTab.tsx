"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { useLoggerConfig } from "@/hooks/use-logger-config";
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  Divider,
  Grid,
} from "@mui/material";

export function LoggerSettingsTab() {
  const { isDark } = useTheme();
  const { loggerConfig, updateConfig, loading } = useLoggerConfig();

  return (
    <Card
      sx={{
        background: isDark
          ? "rgba(30, 41, 59, 0.5)"
          : "rgba(248, 250, 252, 0.8)",
        backdropFilter: "blur(10px)",
        border: `1px solid ${
          isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"
        }`,
      }}
    >
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={3}>
          Log Levels
        </Typography>

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={loggerConfig?.enableConsoleLogging ?? true}
                onChange={(e) =>
                  updateConfig({ enableConsoleLogging: e.target.checked })
                }
                color="primary"
              />
            }
            label="Enable Console Logging"
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Console Level
          </Typography>
          <Select
            fullWidth
            value={loggerConfig?.consoleLevel ?? "info"}
            onChange={(e) => updateConfig({ consoleLevel: e.target.value })}
            size="small"
            disabled={!loggerConfig?.enableConsoleLogging}
          >
            <MenuItem value="error">Error</MenuItem>
            <MenuItem value="warn">Warning</MenuItem>
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="debug">Debug</MenuItem>
          </Select>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={loggerConfig?.enableFileLogging ?? true}
                onChange={(e) =>
                  updateConfig({ enableFileLogging: e.target.checked })
                }
                color="primary"
              />
            }
            label="Enable File Logging (logs/ directory)"
          />
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                File Level (application.log)
              </Typography>
              <Select
                fullWidth
                value={loggerConfig?.fileLevel ?? "info"}
                onChange={(e) => updateConfig({ fileLevel: e.target.value })}
                size="small"
                disabled={!loggerConfig?.enableFileLogging}
              >
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="warn">Warning</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="debug">Debug</MenuItem>
              </Select>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Error File Level (errors.log)
              </Typography>
              <Select
                fullWidth
                value={loggerConfig?.errorLevel ?? "error"}
                onChange={(e) => updateConfig({ errorLevel: e.target.value })}
                size="small"
                disabled={!loggerConfig?.enableFileLogging}
              >
                <MenuItem value="error">Error Only</MenuItem>
                <MenuItem value="warn">Error + Warning</MenuItem>
              </Select>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Max File Size
              </Typography>
              <Select
                fullWidth
                value={loggerConfig?.maxFileSize ?? "20m"}
                onChange={(e) => updateConfig({ maxFileSize: e.target.value })}
                size="small"
                disabled={!loggerConfig?.enableFileLogging}
              >
                <MenuItem value="10m">10 MB</MenuItem>
                <MenuItem value="20m">20 MB</MenuItem>
                <MenuItem value="50m">50 MB</MenuItem>
                <MenuItem value="100m">100 MB</MenuItem>
                <MenuItem value="500m">500 MB</MenuItem>
              </Select>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                File Retention Period
              </Typography>
              <Select
                fullWidth
                value={loggerConfig?.maxFiles ?? "30d"}
                onChange={(e) => updateConfig({ maxFiles: e.target.value })}
                size="small"
                disabled={!loggerConfig?.enableFileLogging}
              >
                <MenuItem value="7d">7 Days</MenuItem>
                <MenuItem value="14d">14 Days</MenuItem>
                <MenuItem value="30d">30 Days</MenuItem>
                <MenuItem value="60d">60 Days</MenuItem>
                <MenuItem value="90d">90 Days</MenuItem>
              </Select>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
