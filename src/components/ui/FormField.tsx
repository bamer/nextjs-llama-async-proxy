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
  disabled?: boolean;
}

export function FormField({
  label,
  name,
  value,
  onChange,
  error,
  helperText,
  tooltip,
  type,
  options,
  fullWidth,
  disabled,
}: FormFieldProps) {
  const hasError = !!error;
  const helperTextDisplay = hasError ? error : helperText;
  const fieldType: FormFieldProps["type"] = type ?? "text";
  const fieldOptions = options ?? [];
  const isFullWidth: boolean = fullWidth ?? false;
  const isDisabled: boolean = disabled ?? false;

  // Debug: log each section before rendering
  if (typeof window !== 'undefined' && (window as any).__TESTING__) {
    console.log('FormField rendering:', { fieldType, hasOptions: fieldOptions.length > 0 });
  }

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
                onChange={(event, checked) => handleChange(event, checked)}
                name={name}
                color="primary"
            disabled={isDisabled}
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

  if (fieldType === "select") {
    return (
      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth={isFullWidth}>
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
            onChange={(event) => {
              const evt = event as unknown as { target?: { value: string } } | { value: string };
              const value = 'target' in evt && evt.target ? evt.target.value : (evt as { value: string }).value;
              handleChange(event as React.ChangeEvent<unknown>, value);
            }}
            error={hasError}
            disabled={isDisabled}
          >
            {fieldOptions.map((option) => (
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
        fullWidth={isFullWidth}
        label={renderLabel()}
        name={name}
        value={value}
        type={fieldType}
        onChange={(event) => handleChange(event, (event.target as any).value)}
        error={hasError}
        helperText={helperTextDisplay}
        InputLabelProps={{
          shrink: true,
        }}
        disabled={isDisabled}
        variant="outlined"
      />
    </Box>
  );
}
