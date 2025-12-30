"use client";

import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLoggerConfig } from "@/hooks/use-logger-config";
import {
  Typography,
  Box,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import { Storage as StorageIcon } from "@mui/icons-material";
import { FormSection } from "@/components/ui/FormSection";

interface LoggerSettingsTabProps {
  fieldErrors?: Record<string, string>;
}

export function LoggerSettingsTab({ fieldErrors }: LoggerSettingsTabProps = {}) {
  const { isDark } = useTheme();
  const { loggerConfig, updateConfig, loading, clearFieldError } = useLoggerConfig();

  const SelectWithError = (props: {
    label: string;
    value: string;
    onChange: (e: any) => void;
    error?: string;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {props.label}
      </Typography>
      <Select
        fullWidth
        value={props.value}
        onChange={props.onChange}
        size="small"
        disabled={!!props.disabled}
        error={!!props.error}
      >
        {props.children}
      </Select>
      {props.error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
          {props.error}
        </Typography>
      )}
    </Box>
  );

  return (
    <>
      <FormSection title="Console Logging" icon={<StorageIcon />} spacing={2}>
        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={
              <Switch
                checked={loggerConfig?.enableConsoleLogging ?? true}
                onChange={(e) => updateConfig({ enableConsoleLogging: e.target.checked })}
                color="primary"
              />
            }
            label="Enable Console Logging"
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <SelectWithError
            label="Console Level"
            value={loggerConfig?.consoleLevel ?? "info"}
            onChange={(e) => {
              updateConfig({ consoleLevel: e.target.value });
              clearFieldError("consoleLevel");
            }}
            error={fieldErrors?.consoleLevel}
            disabled={!loggerConfig?.enableConsoleLogging}
          >
            <MenuItem value="error">Error</MenuItem>
            <MenuItem value="warn">Warning</MenuItem>
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="debug">Debug</MenuItem>
          </SelectWithError>
        </Grid>
      </FormSection>

      <FormSection title="File Logging" icon={<StorageIcon />} spacing={2} divider={false}>
        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={
              <Switch
                checked={loggerConfig?.enableFileLogging ?? true}
                onChange={(e) => updateConfig({ enableFileLogging: e.target.checked })}
                color="primary"
              />
            }
            label="Enable File Logging (logs/ directory)"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SelectWithError
            label="File Level (application.log)"
            value={loggerConfig?.fileLevel ?? "info"}
            onChange={(e) => {
              updateConfig({ fileLevel: e.target.value });
              clearFieldError("fileLevel");
            }}
            error={fieldErrors?.fileLevel}
            disabled={!loggerConfig?.enableFileLogging}
          >
            <MenuItem value="error">Error</MenuItem>
            <MenuItem value="warn">Warning</MenuItem>
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="debug">Debug</MenuItem>
          </SelectWithError>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SelectWithError
            label="Error File Level (errors.log)"
            value={loggerConfig?.errorLevel ?? "error"}
            onChange={(e) => {
              updateConfig({ errorLevel: e.target.value });
              clearFieldError("errorLevel");
            }}
            error={fieldErrors?.errorLevel}
            disabled={!loggerConfig?.enableFileLogging}
          >
            <MenuItem value="error">Error Only</MenuItem>
            <MenuItem value="warn">Error + Warning</MenuItem>
          </SelectWithError>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SelectWithError
            label="Max File Size"
            value={loggerConfig?.maxFileSize ?? "20m"}
            onChange={(e) => {
              updateConfig({ maxFileSize: e.target.value });
              clearFieldError("maxFileSize");
            }}
            error={fieldErrors?.maxFileSize}
            disabled={!loggerConfig?.enableFileLogging}
          >
            <MenuItem value="10m">10 MB</MenuItem>
            <MenuItem value="20m">20 MB</MenuItem>
            <MenuItem value="50m">50 MB</MenuItem>
            <MenuItem value="100m">100 MB</MenuItem>
            <MenuItem value="500m">500 MB</MenuItem>
          </SelectWithError>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SelectWithError
            label="File Retention Period"
            value={loggerConfig?.maxFiles ?? "30d"}
            onChange={(e) => {
              updateConfig({ maxFiles: e.target.value });
              clearFieldError("maxFiles");
            }}
            error={fieldErrors?.maxFiles}
            disabled={!loggerConfig?.enableFileLogging}
          >
            <MenuItem value="7d">7 Days</MenuItem>
            <MenuItem value="14d">14 Days</MenuItem>
            <MenuItem value="30d">30 Days</MenuItem>
            <MenuItem value="60d">60 Days</MenuItem>
            <MenuItem value="90d">90 Days</MenuItem>
          </SelectWithError>
        </Grid>
      </FormSection>
    </>
  );
}
