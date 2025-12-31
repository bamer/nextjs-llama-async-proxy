"use client";

import { Card, CardContent, Typography, FormControlLabel, Switch, Slider } from "@mui/material";
import { m } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import type { LoggerConfig } from "@/hooks/use-logger-config";

interface ConsoleLoggingSectionProps {
  config: LoggerConfig;
  onChange: (key: keyof LoggerConfig, value: string | boolean) => void;
}

export default function ConsoleLoggingSection({
  config,
  onChange,
}: ConsoleLoggingSectionProps): React.ReactElement {
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
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
            Console Logging
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Configure console output logging
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={config.enableConsoleLogging}
                onChange={(e) =>
                  onChange("enableConsoleLogging", e.target.checked)
                }
                color="primary"
              />
            }
            label="Enable Console Logging"
          />

          {config.enableConsoleLogging && (
            <>
              <Typography variant="subtitle2" fontWeight="medium" mb={1}>
                Console Log Level
              </Typography>
              <Slider
                value={getLogLevelValue(config.consoleLevel)}
                onChange={(_, value) => {
                  const level = getLogLevelLabel(value as number);
                  onChange("consoleLevel", level);
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
            </>
          )}
        </CardContent>
      </Card>
    </m.div>
  );
}
