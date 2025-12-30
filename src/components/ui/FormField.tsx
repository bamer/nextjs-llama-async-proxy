"use client";

import React from "react";
import {
  TextField,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  FormControl,
  InputLabel,
} from "@mui/material";
import { FormTooltip, TooltipContent } from "./FormTooltip";

export interface FormFieldProps {
  label: string;
  name: string;
  value: string | number | boolean;
  onChange: (name: string, value: string | number | boolean) => void;
  error?: string;
  helperText?: string;
  tooltip?: TooltipContent;
  type?: "text" | "number" | "select" | "boolean";
  options?: Array<{ value: string | number; label: string }>;
  fullWidth?: boolean;
}

export function FormField({
  label,
  name,
  value,
  onChange,
  error,
  helperText,
  tooltip,
  type = "text",
  options = [],
  fullWidth = false,
}: FormFieldProps) {
  const hasError = !!error;
  const helperTextDisplay = hasError ? error : helperText;

  const renderLabel = () => {
    if (!tooltip) {
      return label;
    }

    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography component="span" variant="inherit">
          {label}
        </Typography>
        <FormTooltip content={tooltip} />
      </Box>
    );
  };

  const handleChange = (
    _event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | unknown>,
    newValue?: string | number | boolean
  ) => {
    if (type === "boolean") {
      onChange(name, newValue as boolean);
    } else if (newValue !== undefined) {
      onChange(name, newValue);
    } else if (type === "number") {
      onChange(name, Number(value));
    } else {
      onChange(name, value);
    }
  };

  if (type === "boolean") {
    return (
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={Boolean(value)}
              onChange={(_, checked) => handleChange(null, checked)}
              name={name}
              color="primary"
            />
          }
          label={renderLabel()}
        />
        {(helperTextDisplay || hasError) && (
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: hasError ? "error.main" : "text.secondary",
                display: "block",
                ml: 4,
              }}
            >
              {helperTextDisplay}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  if (type === "select") {
    return (
      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth={fullWidth}>
          <InputLabel
            id={`${name}-label`}
            error={hasError}
            shrink
          >
            {renderLabel()}
          </InputLabel>
          <Select
            labelId={`${name}-label`}
            value={value as string}
            label={label}
            onChange={(e) => handleChange(null, e.target.value)}
            error={hasError}
          >
            {options.map((option) => (
              <MenuItem key={String(option.value)} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {helperTextDisplay && (
            <Typography
              variant="caption"
              sx={{
                color: hasError ? "error.main" : "text.secondary",
                display: "block",
                mt: 0.5,
              }}
            >
              {helperTextDisplay}
            </Typography>
          )}
        </FormControl>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        fullWidth={fullWidth}
        label={renderLabel()}
        name={name}
        value={value}
        type={type}
        onChange={(e) => handleChange(null, e.target.value)}
        error={hasError}
        helperText={helperTextDisplay}
        InputLabelProps={{
          shrink: true,
        }}
        variant="outlined"
      />
    </Box>
  );
}
