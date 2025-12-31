"use client";

import React, { useCallback } from "react";
import { Grid } from "@mui/material";
import { FormField } from "@/components/ui/FormField";
import FormSwitch from "@/components/ui/FormSwitch";
import { FormSection } from "@/components/ui/FormSection";
import { SamplingConfig } from "@/config/model-config-schema";
import { ParamDescription } from "@/config/model-params-descriptions";
import { TooltipContent } from "@/config/tooltip-config";

interface MirostatSectionProps {
  config: SamplingConfig;
  onChange: (field: keyof SamplingConfig, value: number | string | boolean) => void;
  descriptions: Record<string, ParamDescription>;
  tooltips: Record<string, TooltipContent>;
}

export function MirostatSection({
  config,
  onChange,
  tooltips,
}: MirostatSectionProps): React.ReactElement {
  const handleModeChange = useCallback(
    (_e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      onChange("mirostat", checked ? 2 : 0);
    },
    [onChange],
  );

  return (
    <FormSection title="Mirostat Sampling" spacing={2} divider={false}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormSwitch
            label="Enable Mirostat 2.0"
            checked={config.mirostat === 2}
            onChange={handleModeChange}
            helperText="Constant perplexity sampling"
            tooltip={tooltips.mirostat?.description}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormField
            label="Mirostat Tau"
            name="mirostat_tau"
            value={config.mirostat_tau}
            type="number"
            onChange={(_name: string, value: string | number | boolean) => onChange("mirostat_tau", Number(value))}
            helperText="Target perplexity (default: 5.0)"
            tooltip={tooltips.mirostat_ent}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormField
            label="Mirostat Eta"
            name="mirostat_eta"
            value={config.mirostat_eta}
            type="number"
            onChange={(_name: string, value: string | number | boolean) => onChange("mirostat_eta", Number(value))}
            helperText="Learning rate (default: 0.1)"
            tooltip={tooltips.mirostat_lr}
            fullWidth
          />
        </Grid>
      </Grid>
    </FormSection>
  );
}
