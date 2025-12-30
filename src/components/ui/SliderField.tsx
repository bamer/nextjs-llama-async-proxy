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
  marks?: Array<{ value: number; label: string }>;
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
}: SliderFieldProps): JSX.Element {
  const handleSliderChange = useCallback(
    (_event: Event | React.SyntheticEvent<Element, Event>, newValue: number | number[]) => {
      onChange(newValue as number);
    },
    [onChange],
  );

  const input = (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {value.toFixed(step >= 1 ? 0 : 2)}
          {unit && <span> {unit}</span>}
        </Typography>
      </Box>
      <Slider
        value={value}
        onChange={handleSliderChange}
        min={min}
        max={max}
        step={step}
        marks={marks}
        valueLabelDisplay="off"
        sx={{
          "& .MuiSlider-thumb": {
            height: 20,
            width: 20,
          },
        }}
      />
    </Box>
  );

  return description ? <Tooltip title={description} arrow placement="top">{input}</Tooltip> : input;
}
