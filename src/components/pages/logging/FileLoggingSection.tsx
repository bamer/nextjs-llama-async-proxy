"use client";

import { Card, CardContent, Typography, Slider } from "@mui/material";
import { m } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import FormSwitch from "@/components/ui/FormSwitch";
import { FormField } from "@/components/ui/FormField";
import type { LoggerConfig } from "@/hooks/use-logger-config";

interface FileLoggingSectionProps {
  config: LoggerConfig;
  onChange: (key: keyof LoggerConfig, value: string | boolean) => void;
}

export default function FileLoggingSection({
  config,
  onChange,
}: FileLoggingSectionProps): JSX.Element {
  const { isDark } = useTheme();
  const logLevels = ["error", "warn", "info", "debug", "verbose"];

  const getLogLevelValue = (level: string): number => {
    return logLevels.indexOf(level);
  };

  const getLogLevelLabel = (value: number): string => {
    return logLevels[value] || "info";
  };

  return (
    <m.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <Card
        sx={{
          height: "100%",
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
            File Logging
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Configure file logging with rotation
          </Typography>

          <FormSwitch
            label="Enable File Logging"
            checked={config.enableFileLogging}
            onChange={(e) => onChange("enableFileLogging", e.target.checked)}
          />

          {config.enableFileLogging && (
            <>
              <Typography variant="subtitle2" fontWeight="medium" mb={1}>
                File Log Level
              </Typography>
              <Slider
                value={getLogLevelValue(config.fileLevel)}
                onChange={(_, value) => {
                  const level = getLogLevelLabel(value as number);
                  onChange("fileLevel", level);
                }}
                min={0}
                max={4}
                step={1}
                marks={logLevels.map((level, index) => ({
                  value: index,
                  label: level,
                }))}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => getLogLevelLabel(value)}
              />

              <Typography variant="subtitle2" fontWeight="medium" mb={1}>
                Error Log Level
              </Typography>
              <Slider
                value={getLogLevelValue(config.errorLevel)}
                onChange={(_, value) => {
                  const level = getLogLevelLabel(value as number);
                  onChange("errorLevel", level);
                }}
                min={0}
                max={4}
                step={1}
                marks={logLevels.map((level, index) => ({
                  value: index,
                  label: level,
                }))}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => getLogLevelLabel(value)}
              />

              <FormField
                label="Max File Size"
                name="maxFileSize"
                value={config.maxFileSize}
                onChange={(_, value) => onChange("maxFileSize", value as string)}
                helperText="e.g., 20m, 1g"
                fullWidth
              />

              <FormField
                label="Max Files"
                name="maxFiles"
                value={config.maxFiles}
                onChange={(_, value) => onChange("maxFiles", value as string)}
                helperText="e.g., 30d, 7d"
                fullWidth
              />
            </>
          )}
        </CardContent>
      </Card>
    </m.div>
  );
}
