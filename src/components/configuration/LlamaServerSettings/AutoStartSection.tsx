"use client";

import { Box, Typography, FormControl, FormControlLabel, Checkbox } from "@mui/material";

export function AutoStartSection({
  autoStartValue,
  handleChange,
  fieldErrors
}: {
  autoStartValue: boolean;
  handleChange: (name: string, value: string | number | boolean) => void;
  fieldErrors: Record<string, string>;
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <FormControl>
        <FormControlLabel
          control={
            <Checkbox
              checked={autoStartValue}
              onChange={(_, checked) => handleChange("llamaServer.autoStart", checked)}
              name="llamaServer-autoStart"
              color="primary"
            />
          }
          label="Auto-start llama-server on application startup"
        />
        <Typography
          variant="caption"
          sx={{ ml: 2, color: fieldErrors.autoStart ? "error.main" : "text.secondary" }}
        >
          {fieldErrors.autoStart || "Automatically start llama-server when application starts"}
        </Typography>
      </FormControl>
    </Box>
  );
}