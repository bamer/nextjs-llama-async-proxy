"use client";

import React, { useCallback } from "react";
import { Box, Grid, Tooltip, TextField } from "@mui/material";
import FormSwitch from "@/components/ui/FormSwitch";
import SliderField from "@/components/ui/SliderField";
import { GPUConfig } from "@/config/model-config-schema";
import { PARAM_DESCRIPTIONS } from "@/components/models/ModelConfigDialog";

interface GPUFormProps {
  config: GPUConfig;
  onChange: (config: GPUConfig) => void;
}

export default function GPUForm({ config, onChange }: GPUFormProps): JSX.Element {
  const handleChange = useCallback(
    (field: keyof GPUConfig, value: number | boolean | string) => {
      onChange({ ...config, [field]: value });
    },
    [config, onChange],
  );

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.n_gpu_layers} arrow>
          <TextField
            fullWidth
            label="GPU Layers"
            type="number"
            value={config.n_gpu_layers}
            onChange={(e) => handleChange("n_gpu_layers", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: -1 } }}
            helperText="-1 for all layers"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.n_gpu} arrow>
          <TextField
            fullWidth
            label="Number of GPUs"
            type="number"
            value={config.n_gpu}
            onChange={(e) => handleChange("n_gpu", parseInt(e.target.value) || 1)}
            InputProps={{ inputProps: { min: 1 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.tensor_split} arrow>
          <TextField
            fullWidth
            label="Tensor Split"
            value={config.tensor_split}
            onChange={(e) => handleChange("tensor_split", e.target.value)}
            helperText="Comma-separated values (e.g., 16,8)"
            placeholder="e.g., 16,8"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.main_gpu} arrow>
          <TextField
            fullWidth
            label="Main GPU"
            type="number"
            value={config.main_gpu}
            onChange={(e) => handleChange("main_gpu", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 0 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <FormSwitch
            label="Lock MM Tensors"
            checked={config.mm_lock}
            onChange={(_e, checked) => handleChange("mm_lock", checked)}
            tooltip={PARAM_DESCRIPTIONS.mm_lock}
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <FormSwitch
            label="list_devices"
            checked={config.list_devices}
            onChange={(_e, checked) => handleChange("list_devices", checked)}
            tooltip="List available devices"
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <FormSwitch
            label="kv_offload"
            checked={config.kv_offload}
            onChange={(_e, checked) => handleChange("kv_offload", checked)}
            tooltip="Offload KV cache"
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <FormSwitch
            label="repack"
            checked={config.repack}
            onChange={(_e, checked) => handleChange("repack", checked)}
            tooltip="Repack tensors"
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <FormSwitch
            label="no_host"
            checked={config.no_host}
            onChange={(_e, checked) => handleChange("no_host", checked)}
            tooltip="No host offload"
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Split mode (layer, row)" arrow>
          <TextField
            fullWidth
            label="split_mode"
            value={config.split_mode}
            onChange={(e) => handleChange("split_mode", e.target.value)}
            placeholder="layer"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Device to use (e.g., cuda:0)" arrow>
          <TextField
            fullWidth
            label="device"
            value={config.device}
            onChange={(e) => handleChange("device", e.target.value)}
            placeholder="cuda:0"
            size="small"
          />
        </Tooltip>
      </Grid>
    </Grid>
  );
}
