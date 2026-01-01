"use client";

import { memo } from "react";
import { TextField, Typography } from "@mui/material";
import type { FieldDefinition } from "./types";
import { TooltipContent } from "@/config/tooltip-config";
import { FieldWithTooltip } from "../FormTooltip";

export const MemoizedTextField = memo(({
  field,
  value,
  error,
  tooltipContent,
  onChange,
}: {
  field: FieldDefinition;
  value: unknown;
  error?: string;
  tooltipContent?: TooltipContent;
  onChange: (name: string, value: unknown) => void;
}) => (
  <FieldWithTooltip content={tooltipContent as TooltipContent}>
    <TextField
      fullWidth
      size="small"
      label={field.label}
      value={value}
      onChange={(e) => onChange(field.name, e.target.value)}
      variant="outlined"
      error={Boolean(error)}
      helperText={error}
      sx={{
        transition: "all 0.2s ease",
      }}
    />
  </FieldWithTooltip>
));

MemoizedTextField.displayName = "MemoizedTextField";

export const MemoizedBooleanField = memo(({
  field,
  tooltipContent,
}: {
  field: FieldDefinition;
  tooltipContent?: TooltipContent;
}) => (
  <FieldWithTooltip content={tooltipContent as TooltipContent}>
    <Typography variant="body2" sx={{ fontWeight: 500 }}>
      {field.label}
    </Typography>
  </FieldWithTooltip>
));

MemoizedBooleanField.displayName = "MemoizedBooleanField";

export const MemoizedSelectField = memo(({
  field,
  error,
  tooltipContent,
}: {
  field: FieldDefinition;
  error?: string;
  tooltipContent?: TooltipContent;
}) => (
  <FieldWithTooltip content={tooltipContent as TooltipContent}>
    <Typography variant="caption" color={error ? "error" : "text.secondary"} sx={{ mt: 0.5, ml: 0.75 }}>
      {error || field.label}
    </Typography>
  </FieldWithTooltip>
));

MemoizedSelectField.displayName = "MemoizedSelectField";
