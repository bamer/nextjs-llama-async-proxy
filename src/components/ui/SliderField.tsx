"use client";

import React, { useCallback } from "react";
import { Box, Slider, Tooltip, Typography } from "@mui/material";

export interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  description?: string;
  marks?: Array<{ value: number; label?: string }>;
  unit?: string;
}

export default function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  description,
  marks,
  unit,
}: SliderFieldProps): React.ReactElement {
  const handleSliderChange = useCallback(
    (_event: Event | React.SyntheticEvent<Element, Event>, newValue: number | number[]) => {
      onChange(newValue as number);
    },
    [onChange],
  );

  const input = React.createElement(
    Box,
    { sx: { mb: 2 } },
    React.createElement(
      Box,
      { sx: { display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 } },
      React.createElement(
        Typography,
        { variant: "body2", sx: { fontWeight: 500 } },
        label
      ),
      React.createElement(
        Typography,
        { variant: "body2", color: "textSecondary" },
        `${value.toFixed(step >= 1 ? 0 : 2)}${unit ? ` ${unit}` : ""}`
      )
    ),
    React.createElement(
      Slider,
      {
        value,
        onChange: handleSliderChange,
        min,
        max,
        step,
        ...(marks !== undefined ? { marks } : {}),
        valueLabelDisplay: "off",
        sx: {
          "& .MuiSlider-thumb": {
            height: 20,
            width: 20,
          },
        },
      }
    )
  );

  return description ? <Tooltip title={description} arrow placement="top">{input}</Tooltip> : input;
}
