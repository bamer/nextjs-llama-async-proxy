"use client";

import React, { useCallback } from "react";
import { Box, Grid, TextField, Tooltip } from "@mui/material";
import FormSwitch from "@/components/ui/FormSwitch";
import { MultimodalConfig } from "@/config/model-config-schema";
import { PARAM_DESCRIPTIONS } from "@/config/model-params-descriptions";

interface MultimodalFormProps {
  config: MultimodalConfig;
  onChange: (config: MultimodalConfig) => void;
}

export default function MultimodalForm({ config, onChange }: MultimodalFormProps): React.ReactElement {
  const handleChange = useCallback(
    (field: keyof MultimodalConfig, value: string | number | boolean) => {
      onChange({ ...config, [field]: value as any });
    },
    [config, onChange],
  );

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.multimodal?.image_data?.description || "Image data for multimodal input"} arrow>
          <TextField
            fullWidth
            label="Image Data"
            value={config.image_data}
            onChange={(e) => handleChange("image_data", e.target.value)}
            placeholder="Image data or path"
            helperText="Image data for multimodal input"
            size="small"
            multiline
            rows={3}
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <FormSwitch
            label="Cache CLIP Vision Model"
            checked={config.clip_vision_cache}
            onChange={(_e, checked) => handleChange("clip_vision_cache", checked)}
            tooltip={PARAM_DESCRIPTIONS.multimodal?.clip_vision_cache?.description || "Cache CLIP vision model"}
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.multimodal?.mmproj?.description || "Path to multimodal projection model"} arrow>
          <TextField
            fullWidth
            label="MMProj Model Path"
            value={config.mmproj}
            onChange={(e) => handleChange("mmproj", e.target.value)}
            placeholder="/path/to/mmproj.bin"
            helperText="Path to multimodal projection model"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <FormSwitch
            label="mmproj_auto"
            checked={config.mmproj_auto}
            onChange={(_e, checked) => handleChange("mmproj_auto", checked)}
            tooltip="Auto-detect mmproj model"
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <FormSwitch
            label="mmproj_offload"
            checked={config.mmproj_offload}
            onChange={(_e, checked) => handleChange("mmproj_offload", checked)}
            tooltip="Offload mmproj to GPU"
          />
        </Box>
      </Grid>
    </Grid>
  );
}
