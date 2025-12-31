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
        <Tooltip title="Taille de fenêtre de contexte (nombre de tokens dans le prompt + completion)" arrow>
          <TextField
            fullWidth
            label="ctx_size"
            type="number"
            value={config.ctx_size}
            onChange={(e) => handleChange("ctx_size", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 1 } }}
            helperText="Nombre de tokens"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Taille de lot maximum pour le traitement du prompt" arrow>
          <TextField
            fullWidth
            label="Taille du Batch"
            type="number"
            value={config.num_batch}
            onChange={(e) => handleChange("num_batch", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 1 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="RAM maximale à utiliser pour le cache KV en Mo (0 = illimité)" arrow>
          <TextField
            fullWidth
            label="Cache RAM (Mo)"
            type="number"
            value={config.cache_ram}
            onChange={(e) => handleChange("cache_ram", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 0 } }}
            helperText="0 pour illimité"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <FormSwitch
            label="Utiliser Mémoire F16"
            checked={config.memory_f16}
            onChange={(_e, checked) => handleChange("memory_f16", checked)}
            tooltip="Utiliser des flottants demi-précision pour économiser l'espace mémoire"
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <FormSwitch
            label="Verrouiller la Mémoire"
            checked={config.memory_lock}
            onChange={(_e, checked) => handleChange("memory_lock", checked)}
            tooltip="Verrouiller les allocations mémoire pour empêcher la relocalisation"
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <FormSwitch
            label="mmap"
            checked={config.mmap}
            onChange={(_e, checked) => handleChange("mmap", checked)}
            tooltip="Cartographier le fichier modèle en mémoire"
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <FormSwitch
            label="mlock"
            checked={config.mlock}
            onChange={(_e, checked) => handleChange("mlock", checked)}
            tooltip="Verrouiller la mémoire en RAM"
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Politique NUMA (ex: distribute)" arrow>
          <TextField
            fullWidth
            label="numa"
            value={config.numa}
            onChange={(e) => handleChange("numa", e.target.value)}
            placeholder="distribute"
            helperText="Vide pour défaut"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Seuil de défragmentation" arrow>
          <TextField
            fullWidth
            label="defrag_thold"
            type="number"
            value={config.defrag_thold}
            onChange={(e) => handleChange("defrag_thold", parseFloat(e.target.value) || -1)}
            InputProps={{ inputProps: { min: -1, step: 0.1 } }}
            helperText="-1 pour désactivé"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Type de cache KV pour K" arrow>
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
        <Tooltip title="Type de cache KV pour V" arrow>
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
