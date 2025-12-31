"use client";

import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLoggerConfig } from "@/hooks/use-logger-config";
import { Grid, MenuItem } from "@mui/material";
import { Storage as StorageIcon } from "@mui/icons-material";
import { FormSection } from "@/components/ui/FormSection";
import { FormField } from "@/components/ui/FormField";

interface LoggerSettingsTabProps {
  fieldErrors?: Record<string, string>;
}

export function LoggerSettingsTab({ fieldErrors }: LoggerSettingsTabProps = {}) {
  const { isDark } = useTheme();
  const { loggerConfig, updateConfig, loading, clearFieldError } = useLoggerConfig();

  const levelOptions = [
    { value: "error", label: "Error" },
    { value: "warn", label: "Warning" },
    { value: "info", label: "Info" },
    { value: "debug", label: "Debug" },
  ];

  const errorLevelOptions = [
    { value: "error", label: "Error Only" },
    { value: "warn", label: "Error + Warning" },
  ];

  const fileSizeOptions = [
    { value: "10m", label: "10 MB" },
    { value: "20m", label: "20 MB" },
    { value: "50m", label: "50 MB" },
    { value: "100m", label: "100 MB" },
    { value: "500m", label: "500 MB" },
  ];

  const retentionOptions = [
    { value: "7d", label: "7 Days" },
    { value: "14d", label: "14 Days" },
    { value: "30d", label: "30 Days" },
    { value: "60d", label: "60 Days" },
    { value: "90d", label: "90 Days" },
  ];

  const handleChange = (name: string, value: string | number | boolean) => {
    const config: any = {};
    config[name] = value;
    updateConfig(config);
  };

  const getError = (fieldName: string): string | undefined => {
    const error = fieldErrors?.[fieldName];
    return error ? error : undefined;
  };

  const getFieldProps = (fieldName: string) => {
    const error = getError(fieldName);
    return error ? { error } : {};
  };

  return (
    <>
      <FormSection title="Console Logging" icon={<StorageIcon />} spacing={2}>
        <Grid size={{ xs: 12 }}>
          <FormField
            label="Enable Console Logging"
            name="enableConsoleLogging"
            type="boolean"
            value={loggerConfig?.enableConsoleLogging ?? true}
            onChange={handleChange}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormField
            label="Console Level"
            name="consoleLevel"
            type="select"
            value={loggerConfig?.consoleLevel ?? "info"}
            onChange={(name, value) => {
              handleChange(name, value);
              clearFieldError("consoleLevel");
            }}
            options={levelOptions}
            fullWidth
            {...getFieldProps("consoleLevel")}
          />
        </Grid>
      </FormSection>

      <FormSection title="File Logging" icon={<StorageIcon />} spacing={2} divider={false}>
        <Grid size={{ xs: 12 }}>
          <FormField
            label="Enable File Logging (logs/ directory)"
            name="enableFileLogging"
            type="boolean"
            value={loggerConfig?.enableFileLogging ?? true}
            onChange={handleChange}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            label="File Level (application.log)"
            name="fileLevel"
            type="select"
            value={loggerConfig?.fileLevel ?? "info"}
            onChange={(name, value) => {
              handleChange(name, value);
              clearFieldError("fileLevel");
            }}
            options={levelOptions}
            disabled={!loggerConfig?.enableFileLogging}
            fullWidth
            {...getFieldProps("fileLevel")}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            label="Error File Level (errors.log)"
            name="errorLevel"
            type="select"
            value={loggerConfig?.errorLevel ?? "error"}
            onChange={(name, value) => {
              handleChange(name, value);
              clearFieldError("errorLevel");
            }}
            options={errorLevelOptions}
            disabled={!loggerConfig?.enableFileLogging}
            fullWidth
            {...getFieldProps("errorLevel")}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            label="Max File Size"
            name="maxFileSize"
            type="select"
            value={loggerConfig?.maxFileSize ?? "20m"}
            onChange={(name, value) => {
              handleChange(name, value);
              clearFieldError("maxFileSize");
            }}
            options={fileSizeOptions}
            disabled={!loggerConfig?.enableFileLogging}
            fullWidth
            {...getFieldProps("maxFileSize")}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            label="File Retention Period"
            name="maxFiles"
            type="select"
            value={loggerConfig?.maxFiles ?? "30d"}
            onChange={(name, value) => {
              handleChange(name, value);
              clearFieldError("maxFiles");
            }}
            options={retentionOptions}
            disabled={!loggerConfig?.enableFileLogging}
            fullWidth
            {...getFieldProps("maxFiles")}
          />
        </Grid>
      </FormSection>
    </>
  );
}
