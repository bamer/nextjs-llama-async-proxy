"use client";

import React from "react";
import { Grid } from "@mui/material";
import { FormField } from "@/components/ui/FormField";
import FormSwitch from "@/components/ui/FormSwitch";
import { FormSection } from "@/components/ui/FormSection";
import { AdvancedConfig } from "@/config/model-config-schema";
import { TooltipContent } from "@/config/tooltip-config";

interface AdvancedOptionsSectionProps {
  config: AdvancedConfig;
  onChange: (field: keyof AdvancedConfig, value: number | boolean | string) => void;
  tooltips: Record<string, TooltipContent>;
}

export function AdvancedOptionsSection({
  config,
  onChange,
  tooltips,
}: AdvancedOptionsSectionProps): React.ReactElement {
  const switchFields = [
    {
      label: "SWA Full",
      name: "swa_full" as const,
      checked: config.swa_full,
      tooltip: tooltips.swa_full?.description,
    },
    {
      label: "CPU MoE",
      name: "cpu_moe" as const,
      checked: config.cpu_moe,
      tooltip: tooltips.cpu_moe?.description,
    },
    {
      label: "KV Unified",
      name: "kv_unified" as const,
      checked: config.kv_unified,
      tooltip: tooltips.kv_unified?.description,
    },
    {
      label: "Context Shift",
      name: "context_shift" as const,
      checked: config.context_shift,
      tooltip: tooltips.context_shift?.description,
    },
    {
      label: "Offline Mode",
      name: "offline" as const,
      checked: config.offline,
      tooltip: tooltips.offline?.description,
    },
    {
      label: "Op Offload",
      name: "op_offload" as const,
      checked: config.op_offload,
      tooltip: tooltips.op_offload?.description,
    },
    {
      label: "Check Tensors",
      name: "check_tensors" as const,
      checked: config.check_tensors,
      tooltip: tooltips.check_tensors?.description,
    },
  ];

  const textFields = [
    {
      label: "Override Tensor",
      name: "override_tensor" as const,
      value: config.override_tensor,
      helperText: "Format: f16, q8_0",
      tooltip: tooltips.override_tensor,
    },
    {
      label: "N CPU MoE",
      name: "n_cpu_moe" as const,
      type: "number" as const,
      value: config.n_cpu_moe,
      helperText: "Number of MoE experts on CPU",
      tooltip: tooltips.n_cpu_moe,
    },
    {
      label: "RPC Server",
      name: "rpc" as const,
      value: config.rpc,
      helperText: "RPC server address",
      tooltip: tooltips.rpc,
    },
    {
      label: "Override KV",
      name: "override_kv" as const,
      value: config.override_kv,
      helperText: "KV cache settings override",
      tooltip: tooltips.override_kv,
    },
  ];

  return (
    <FormSection title="Advanced Options" spacing={2} divider={false}>
      <Grid container spacing={2}>
        {switchFields.map((field) => (
          <Grid key={field.label} size={{ xs: 12, sm: 6 }}>
            <FormSwitch
              label={field.label}
              checked={field.checked}
              onChange={(_e, checked) => onChange(field.name, checked)}
              tooltip={field.tooltip}
            />
          </Grid>
        ))}
        {textFields.map((field) => (
          <Grid key={field.label} size={{ xs: 12, sm: 6 }}>
            <FormField
              label={field.label}
              name={field.name}
              value={field.value}
              type={field.type || "text"}
              onChange={(_name, value) => onChange(field.name, field.type ? Number(value) : value)}
              helperText={field.helperText}
              tooltip={field.tooltip}
              fullWidth
            />
          </Grid>
        ))}
      </Grid>
    </FormSection>
  );
}
