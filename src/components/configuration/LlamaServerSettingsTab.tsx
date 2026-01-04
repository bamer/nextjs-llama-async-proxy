"use client";

import React from "react";
import { Grid } from "@mui/material";
import { Dns as ServerIcon, Tune as AdvancedIcon, Memory as GpuIcon } from "@mui/icons-material";
import { m } from "framer-motion";
import { FormSection } from "@/components/ui/FormSection";
import { FormField } from "@/components/ui/FormField";

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
  const handleChange = (name: string, value: string | number | boolean) => {
    onLlamaServerChange({ target: { name, value } } as any);
  };

  const getNestedValue = (path: string, defaultValue: any) => {
    const keys = path.split(".");
    let value = formConfig;
    for (const key of keys) {
      value = value?.[key];
    }
    return value ?? defaultValue;
  };

  const serverBindingFields = [
    {
      name: "llamaServer.autoStart",
      label: "Auto-start llama-server on application startup",
      value: getNestedValue("llamaServer.autoStart", false) as boolean,
      helperText: fieldErrors.autoStart || "Automatically start llama-server when the application starts",
      error: fieldErrors.autoStart,
    },
    {
      name: "llamaServer.host",
      label: "Host",
      value: getNestedValue("llamaServer.host", "127.0.0.1"),
      helperText: fieldErrors.host || "Server hostname or IP address",
      error: fieldErrors.host,
    },
    {
      name: "llamaServer.port",
      label: "Port",
      type: "number",
      value: getNestedValue("llamaServer.port", 8080),
      helperText: fieldErrors.port || "Server port number",
      error: fieldErrors.port,
    },
  ];

  const basicOptionsFields = [
    {
      name: "llamaServer.ctx_size",
      label: "Context Size",
      type: "number" as const,
      value: getNestedValue("llamaServer.ctx_size", 4096),
      helperText: fieldErrors.ctx_size || "Maximum context window size",
      error: fieldErrors.ctx_size,
    },
    {
      name: "llamaServer.batch_size",
      label: "Batch Size",
      type: "number" as const,
      value: getNestedValue("llamaServer.batch_size", 2048),
      helperText: fieldErrors.batch_size || "Logical maximum batch size",
      error: fieldErrors.batch_size,
    },
    {
      name: "llamaServer.ubatch_size",
      label: "Micro Batch Size",
      type: "number" as const,
      value: getNestedValue("llamaServer.ubatch_size", 512),
      helperText: "Physical maximum batch size",
    },
    {
      name: "llamaServer.threads",
      label: "Threads",
      type: "number" as const,
      value: getNestedValue("llamaServer.threads", -1),
      helperText: fieldErrors.threads || "CPU threads (-1 = auto)",
      error: fieldErrors.threads,
    },
  ];

  const gpuOptionsFields = [
    {
      name: "llamaServer.gpu_layers",
      label: "GPU Layers",
      type: "number" as const,
      value: getNestedValue("llamaServer.gpu_layers", -1),
      helperText: fieldErrors.gpu_layers || "Layers to offload to GPU (-1 = all)",
      error: fieldErrors.gpu_layers,
    },
    {
      name: "llamaServer.main_gpu",
      label: "Main GPU",
      type: "number" as const,
      value: getNestedValue("llamaServer.main_gpu", 0),
      helperText: "Main GPU device ID",
    },
  ];

  const samplingFields = [
    {
      name: "llamaServer.temperature",
      label: "Temperature",
      type: "number" as const,
      value: getNestedValue("llamaServer.temperature", 0.8),
      helperText: "Sampling temperature (0-2)",
    },
    {
      name: "llamaServer.top_k",
      label: "Top-K",
      type: "number" as const,
      value: getNestedValue("llamaServer.top_k", 40),
      helperText: "Top-K sampling",
    },
    {
      name: "llamaServer.top_p",
      label: "Top-P",
      type: "number" as const,
      value: getNestedValue("llamaServer.top_p", 0.9),
      helperText: "Nucleus sampling",
    },
  ];

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <FormSection title="Server Binding" icon={<ServerIcon />} spacing={2}>
        {serverBindingFields.map((field) => (
          <Grid key={field.name} size={{ xs: 12, md: 6 }}>
            <FormField {...field} onChange={handleChange} fullWidth />
          </Grid>
        ))}
      </FormSection>

      <FormSection title="Basic Options" icon={<AdvancedIcon />} spacing={2}>
        {basicOptionsFields.map((field) => (
          <Grid key={field.name} size={{ xs: 12, md: 6 }}>
            <FormField {...field} onChange={handleChange} fullWidth />
          </Grid>
        ))}
      </FormSection>

      <FormSection title="GPU Options" icon={<GpuIcon />} spacing={2}>
        {gpuOptionsFields.map((field) => (
          <Grid key={field.name} size={{ xs: 12, md: 6 }}>
            <FormField {...field} onChange={handleChange} fullWidth />
          </Grid>
        ))}
      </FormSection>

      <FormSection title="Sampling Parameters" icon={<AdvancedIcon />} spacing={2} divider={false}>
        {samplingFields.map((field) => (
          <Grid key={field.name} size={{ xs: 12, md: 6 }}>
            <FormField {...field} onChange={handleChange} fullWidth />
          </Grid>
        ))}
      </FormSection>
    </m.div>
  );
}
