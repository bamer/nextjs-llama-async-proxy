"use client";

import React, { useCallback } from "react";
import { Grid } from "@mui/material";
import { FormField } from "@/components/ui/FormField";
import { FormSection } from "@/components/ui/FormSection";
import { AdvancedConfig } from "@/config/model-config-schema";
import { TooltipContent } from "@/config/tooltip-config";

interface YaRNSectionProps {
  config: AdvancedConfig;
  onChange: (field: keyof AdvancedConfig, value: number | string) => void;
  tooltips: Record<string, TooltipContent>;
}

export function YaRNSection({
  config,
  onChange,
  tooltips,
}: YaRNSectionProps): React.ReactElement {
  const yarnFields = [
    {
      label: "YaRN Ext Factor",
      name: "yarn_ext_factor" as const,
      type: "number" as const,
      value: config.yarn_ext_factor,
      onChange: (v: number) => onChange("yarn_ext_factor", v),
      helperText: "-1 for disabled",
      tooltip: tooltips.yarn_ext_factor,
    },
    {
      label: "YaRN Original Ctx",
      name: "yarn_orig_ctx" as const,
      type: "number" as const,
      value: config.yarn_orig_ctx,
      onChange: (v: number) => onChange("yarn_orig_ctx", v),
      helperText: "Original context size",
      tooltip: tooltips.yarn_orig_ctx,
    },
    {
      label: "YaRN Attn Factor",
      name: "yarn_attn_factor" as const,
      type: "number" as const,
      value: config.yarn_attn_factor,
      onChange: (v: number) => onChange("yarn_attn_factor", v),
      tooltip: tooltips.yarn_attn_factor,
    },
    {
      label: "YaRN Beta Fast",
      name: "yarn_beta_fast" as const,
      type: "number" as const,
      value: config.yarn_beta_fast,
      onChange: (v: number) => onChange("yarn_beta_fast", v),
      tooltip: tooltips.yarn_beta_fast,
    },
    {
      label: "YaRN Beta Slow",
      name: "yarn_beta_slow" as const,
      type: "number" as const,
      value: config.yarn_beta_slow,
      onChange: (v: number) => onChange("yarn_beta_slow", v),
      tooltip: tooltips.yarn_beta_slow,
    },
  ];

  return (
    <FormSection title="YaRN Settings" spacing={2}>
      <Grid container spacing={2}>
        {yarnFields.map((field) => (
          <Grid key={field.label} size={{ xs: 12, sm: 6 }}>
            <FormField
              label={field.label}
              name={field.name}
              value={field.value}
              type={field.type}
              {...(field.helperText !== undefined && { helperText: field.helperText })}
              tooltip={field.tooltip}
              onChange={(_name: string, value: string | number | boolean) => field.onChange(Number(value))}
            />
          </Grid>
        ))}
      </Grid>
    </FormSection>
  );
}
