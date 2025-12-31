"use client";

import React, { useCallback } from "react";
import { Box, Grid, Tooltip, TextField } from "@mui/material";
import FormSwitch from "@/components/ui/FormSwitch";
import SliderField from "@/components/ui/SliderField";
import { MemoryConfig } from "@/config/model-config-schema";
import { PARAM_DESCRIPTIONS } from "@/config/model-params-descriptions";

interface MemoryFormProps {
  config: MemoryConfig;
  onChange: (config: MemoryConfig) => void;
}

export default function MemoryForm({ config, onChange }: MemoryFormProps): React.ReactElement {
  const handleChange = useCallback(
    (field: keyof MemoryConfig, value: number | boolean | string) => {
      onChange({ ...config, [field]: value });
    },
    [config, onChange],
  );

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Context window size (number of tokens in prompt + completion)" arrow>
          <TextField
            fullWidth
            label="ctx_size"
            type="number"
            value={config.ctx_size}
            onChange={(e) => handleChange("ctx_size", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 1 } }}
            helperText="Number of tokens"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Maximum batch size for prompt processing" arrow>
          <TextField
            fullWidth
            label="Batch Size"
            type="number"
            value={config.num_batch}
            onChange={(e) => handleChange("num_batch", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 1 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Maximum RAM to use for KV cache in MB (0 = unlimited)" arrow>
          <TextField
            fullWidth
            label="Cache RAM (MB)"
            type="number"
            value={config.cache_ram}
            onChange={(e) => handleChange("cache_ram", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 0 } }}
            helperText="0 for unlimited MB"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <FormSwitch
            label="Use F16 Memory"
            checked={config.memory_f16}
            onChange={(_e, checked) => handleChange("memory_f16", checked)}
            tooltip="Use half-precision floats for memory to save space"
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <FormSwitch
            label="Lock Memory"
            checked={config.memory_lock}
            onChange={(_e, checked) => handleChange("memory_lock", checked)}
            tooltip="Lock memory allocations to prevent relocation"
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <FormSwitch
            label="mmap"
            checked={config.mmap}
            onChange={(_e, checked) => handleChange("mmap", checked)}
            tooltip="Memory map model file"
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <FormSwitch
            label="mlock"
            checked={config.mlock}
            onChange={(_e, checked) => handleChange("mlock", checked)}
            tooltip="Lock memory in RAM"
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="NUMA policy (e.g., distribute)" arrow>
          <TextField
            fullWidth
            label="numa"
            value={config.numa}
            onChange={(e) => handleChange("numa", e.target.value)}
            placeholder="distribute"
            helperText="Empty for default"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Defragmentation threshold" arrow>
          <TextField
            fullWidth
            label="defrag_thold"
            type="number"
            value={config.defrag_thold}
            onChange={(e) => handleChange("defrag_thold", parseFloat(e.target.value) || -1)}
            InputProps={{ inputProps: { min: -1, step: 0.1 } }}
            helperText="-1 for disabled"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="KV cache type for K" arrow>
          <TextField
            fullWidth
            label="cache_type_k"
            value={config.cache_type_k}
            onChange={(e) => handleChange("cache_type_k", e.target.value)}
            placeholder="f16"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="KV cache type for V" arrow>
          <TextField
            fullWidth
            label="cache_type_v"
            value={config.cache_type_v}
            onChange={(e) => handleChange("cache_type_v", e.target.value)}
            placeholder="f16"
            size="small"
          />
        </Tooltip>
      </Grid>
    </Grid>
  );
}
