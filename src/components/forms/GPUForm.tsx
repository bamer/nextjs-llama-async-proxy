"use client";

import React, { useCallback } from "react";
import { Box, Grid, Tooltip, TextField } from "@mui/material";
import FormSwitch from "@/components/ui/FormSwitch";
import SliderField from "@/components/ui/SliderField";
import { GPUConfig } from "@/config/model-config-schema";
import { PARAM_DESCRIPTIONS } from "@/config/model-params-descriptions";

interface GPUFormProps {
  config: GPUConfig;
  onChange: (config: GPUConfig) => void;
}

export default function GPUForm({ config, onChange }: GPUFormProps): React.ReactElement {
  const handleChange = useCallback(
    (field: keyof GPUConfig, value: number | boolean | string) => {
      onChange({ ...config, [field]: value });
    },
    [config, onChange],
  );

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.gpu?.n_gpu_layers?.description || "Nombre de couches à décharger sur GPU"} arrow>
          <TextField
            fullWidth
            label="Couches GPU"
            type="number"
            value={config.n_gpu_layers}
            onChange={(e) => handleChange("n_gpu_layers", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: -1 } }}
            helperText="-1 pour toutes les couches"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.gpu?.n_gpu?.description || "Nombre de GPUs à utiliser"} arrow>
          <TextField
            fullWidth
            label="Nombre de GPUs"
            type="number"
            value={config.n_gpu}
            onChange={(e) => handleChange("n_gpu", parseInt(e.target.value) || 1)}
            InputProps={{ inputProps: { min: 1 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.gpu?.tensor_split?.description || "Répartir les tenseurs sur les GPUs"} arrow>
          <TextField
            fullWidth
            label="Répartition Tensor"
            value={config.tensor_split}
            onChange={(e) => handleChange("tensor_split", e.target.value)}
            helperText="Valeurs séparées par virgule (ex: 16,8)"
            placeholder="ex: 16,8"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.gpu?.main_gpu?.description || "ID du GPU principal"} arrow>
          <TextField
            fullWidth
            label="GPU Principal"
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
            label="Verrouiller Tenseurs MM"
            checked={config.mm_lock}
            onChange={(_e, checked) => handleChange("mm_lock", checked)}
            tooltip={PARAM_DESCRIPTIONS.gpu?.mm_lock?.description || "Verrouiller les tenseurs multimodaux"}
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <FormSwitch
            label="Lister les périphériques"
            checked={config.list_devices}
            onChange={(_e, checked) => handleChange("list_devices", checked)}
            tooltip="Lister les périphériques disponibles"
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <FormSwitch
            label="Déchargement KV"
            checked={config.kv_offload}
            onChange={(_e, checked) => handleChange("kv_offload", checked)}
            tooltip="Décharger le cache KV"
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <FormSwitch
            label="Réempaqueter"
            checked={config.repack}
            onChange={(_e, checked) => handleChange("repack", checked)}
            tooltip="Réempaqueter les tenseurs"
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <FormSwitch
            label="Pas d'hôte"
            checked={config.no_host}
            onChange={(_e, checked) => handleChange("no_host", checked)}
            tooltip="Pas de déchargement hôte"
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Mode de partage (layer, row)" arrow>
          <TextField
            fullWidth
            label="mode_de_partage"
            value={config.split_mode}
            onChange={(e) => handleChange("split_mode", e.target.value)}
            placeholder="layer"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Périphérique à utiliser (ex: cuda:0)" arrow>
          <TextField
            fullWidth
            label="périphérique"
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
