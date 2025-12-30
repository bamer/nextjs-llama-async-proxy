"use client";

import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import { m } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import type { LoggerConfig } from "@/hooks/use-logger-config";

interface LoggingPreviewProps {
  config: LoggerConfig;
}

export default function LoggingPreview({
  config,
}: LoggingPreviewProps): JSX.Element {
  const { isDark } = useTheme();

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <Card
        sx={{
          background: isDark
            ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
          boxShadow: isDark
            ? "0 8px 30px rgba(0, 0, 0, 0.3)"
            : "0 8px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Current Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Preview of your current logging settings
          </Typography>

          <Box sx={{ spaceY: 2 }}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Console Logging
              </Typography>
              <Chip
                label={config.enableConsoleLogging ? "Enabled" : "Disabled"}
                color={config.enableConsoleLogging ? "success" : "default"}
                size="small"
              />
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Console Level
              </Typography>
              <Chip
                label={config.consoleLevel}
                color="primary"
                size="small"
              />
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                File Logging
              </Typography>
              <Chip
                label={config.enableFileLogging ? "Enabled" : "Disabled"}
                color={config.enableFileLogging ? "success" : "default"}
                size="small"
              />
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                File Level
              </Typography>
              <Chip
                label={config.fileLevel}
                color="primary"
                size="small"
              />
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Error Level
              </Typography>
              <Chip
                label={config.errorLevel}
                color="error"
                size="small"
              />
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Max File Size
              </Typography>
              <Chip
                label={config.maxFileSize}
                color="default"
                size="small"
              />
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Max Files
              </Typography>
              <Chip
                label={config.maxFiles}
                color="default"
                size="small"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </m.div>
  );
}
