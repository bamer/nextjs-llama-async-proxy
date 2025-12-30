"use client";

import React from "react";
import { Grid, TextField, Typography } from "@mui/material";
import { Dns as ServerIcon, Tune as AdvancedIcon, Memory as GpuIcon } from "@mui/icons-material";
import { m } from "framer-motion";
import { FormSection } from "@/components/ui/FormSection";
import { useTheme } from "@/contexts/ThemeContext";

interface LlamaServerSettingsTabProps {
  formConfig: any;
  onLlamaServerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fieldErrors: Record<string, string>;
}

export function LlamaServerSettingsTab({
  formConfig,
  onLlamaServerChange,
  fieldErrors,
}: LlamaServerSettingsTabProps): React.ReactNode {
  const { isDark } = useTheme();

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <FormSection title="Server Binding" icon={<ServerIcon />} spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Host"
            name="llamaServer.host"
            value={formConfig.llamaServer?.host || "127.0.0.1"}
            onChange={onLlamaServerChange}
            variant="outlined"
            helperText={fieldErrors.host || "Server hostname or IP address"}
            error={!!fieldErrors.host}
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Port"
            name="llamaServer.port"
            type="number"
            value={formConfig.llamaServer?.port || 8080}
            onChange={onLlamaServerChange}
            variant="outlined"
            helperText={fieldErrors.port || "Server port number"}
            error={!!fieldErrors.port}
            size="small"
          />
        </Grid>
      </FormSection>

      <FormSection title="Basic Options" icon={<AdvancedIcon />} spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Context Size"
            name="llamaServer.ctx_size"
            type="number"
            value={formConfig.llamaServer?.ctx_size || 4096}
            onChange={onLlamaServerChange}
            variant="outlined"
            helperText={fieldErrors.ctx_size || "Maximum context window size"}
            error={!!fieldErrors.ctx_size}
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Batch Size"
            name="llamaServer.batch_size"
            type="number"
            value={formConfig.llamaServer?.batch_size || 2048}
            onChange={onLlamaServerChange}
            variant="outlined"
            helperText={fieldErrors.batch_size || "Logical maximum batch size"}
            error={!!fieldErrors.batch_size}
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Micro Batch Size"
            name="llamaServer.ubatch_size"
            type="number"
            value={formConfig.llamaServer?.ubatch_size || 512}
            onChange={onLlamaServerChange}
            variant="outlined"
            helperText="Physical maximum batch size"
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Threads"
            name="llamaServer.threads"
            type="number"
            value={formConfig.llamaServer?.threads || -1}
            onChange={onLlamaServerChange}
            variant="outlined"
            helperText={fieldErrors.threads || "CPU threads (-1 = auto)"}
            error={!!fieldErrors.threads}
            size="small"
          />
        </Grid>
      </FormSection>

      <FormSection title="GPU Options" icon={<GpuIcon />} spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="GPU Layers"
            name="llamaServer.gpu_layers"
            type="number"
            value={formConfig.llamaServer?.gpu_layers || -1}
            onChange={onLlamaServerChange}
            variant="outlined"
            helperText={fieldErrors.gpu_layers || "Layers to offload to GPU (-1 = all)"}
            error={!!fieldErrors.gpu_layers}
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Main GPU"
            name="llamaServer.main_gpu"
            type="number"
            value={formConfig.llamaServer?.main_gpu || 0}
            onChange={onLlamaServerChange}
            variant="outlined"
            helperText="Main GPU device ID"
            size="small"
          />
        </Grid>
      </FormSection>

      <FormSection title="Sampling Parameters" icon={<AdvancedIcon />} spacing={2} divider={false}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Temperature"
            name="llamaServer.temperature"
            type="number"
            value={formConfig.llamaServer?.temperature || 0.8}
            onChange={onLlamaServerChange}
            variant="outlined"
            inputProps={{ step: 0.1, min: 0, max: 2 }}
            helperText="Sampling temperature (0-2)"
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Top-K"
            name="llamaServer.top_k"
            type="number"
            value={formConfig.llamaServer?.top_k || 40}
            onChange={onLlamaServerChange}
            variant="outlined"
            helperText="Top-K sampling"
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Top-P"
            name="llamaServer.top_p"
            type="number"
            value={formConfig.llamaServer?.top_p || 0.9}
            onChange={onLlamaServerChange}
            variant="outlined"
            inputProps={{ step: 0.05, min: 0, max: 1 }}
            helperText="Nucleus sampling"
            size="small"
          />
        </Grid>
      </FormSection>
    </m.div>
  );
}
