"use client";

import React, { useCallback } from "react";
import { Grid, TextField, Tooltip } from "@mui/material";
import SliderField from "@/components/ui/SliderField";
import { LoRAConfig } from "@/config/model-config-schema";
import { PARAM_DESCRIPTIONS } from "@/config/model-params-descriptions";

interface LoRAFormProps {
  config: LoRAConfig;
  onChange: (config: LoRAConfig) => void;
}

export default function LoRAForm({ config, onChange }: LoRAFormProps): React.ReactElement {
  const handleChange = useCallback(
    (field: keyof LoRAConfig, value: number | string) => {
      onChange({ ...config, [field]: value });
    },
    [config, onChange],
  );

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Tooltip title="Path to LoRA adapter file for model fine-tuning" arrow>
          <TextField
            fullWidth
            label="LoRA Adapter Path"
            value={config.lora_adapter}
            onChange={(e) => handleChange("lora_adapter", e.target.value)}
            placeholder="/path/to/lora/adapter.bin"
            helperText="Path to LoRA adapter file"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Tooltip title="Base model path for LoRA adapter compatibility" arrow>
          <TextField
            fullWidth
            label="LoRA Base Model"
            value={config.lora_base}
            onChange={(e) => handleChange("lora_base", e.target.value)}
            placeholder="/path/to/base/model"
            helperText="Base model path for LoRA adapter"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SliderField
          label="LoRA Scale"
          value={config.lora_scale}
          onChange={(v) => handleChange("lora_scale", v)}
          min={0}
          max={1}
          step={0.1}
          description="Scale factor for LoRA adapter influence (0-1)"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Tooltip title="Comma-separated paths to control vector files for steering" arrow>
          <TextField
            fullWidth
            label="Control Vectors"
            value={config.control_vectors}
            onChange={(e) => handleChange("control_vectors", e.target.value)}
            placeholder="/path/to/vector1.bin,/path/to/vector2.bin"
            helperText="Comma-separated paths to control vector files"
            size="small"
            multiline
            rows={2}
          />
        </Tooltip>
      </Grid>
    </Grid>
  );
}
