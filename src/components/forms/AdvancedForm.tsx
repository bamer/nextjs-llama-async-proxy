"use client";

import React, { useCallback } from "react";
import { Grid } from "@mui/material";
import { FormField } from "@/components/ui/FormField";
import FormSwitch from "@/components/ui/FormSwitch";
import { FormSection } from "@/components/ui/FormSection";
import { AdvancedConfig } from "@/config/model-config-schema";
import { tooltipConfig } from "@/config/tooltip-config";
import { YaRNSection } from "./YaRNSection";
import { AdvancedOptionsSection } from "./AdvancedOptionsSection";

interface AdvancedFormProps {
  config: AdvancedConfig;
  onChange: (config: AdvancedConfig) => void;
}

export default function AdvancedForm({ config, onChange }: AdvancedFormProps): React.ReactElement {
  const handleChange = useCallback(
    (field: keyof AdvancedConfig, value: number | boolean | string) => {
      onChange({ ...config, [field]: value });
    },
    [config, onChange],
  );

  const basicFields = [
    {
      label: "Fréquence RoPE",
      name: "rope_frequency" as const,
      type: "number" as const,
      value: config.rope_frequency,
      onChange: (v: number) => handleChange("rope_frequency", v),
      helperText: "Par défaut : 10000",
      tooltip: tooltipConfig.advanced.rope_freq_base,
    },
    {
      label: "Échelle RoPE",
      name: "rope_scale" as const,
      type: "number" as const,
      value: config.rope_scale,
      onChange: (v: number) => handleChange("rope_scale", v),
      helperText: "Par défaut : 1.0",
      tooltip: tooltipConfig.advanced.rope_scale,
    },
    {
      label: "Nombre de Threads",
      name: "num_thread" as const,
      type: "number" as const,
      value: config.num_thread,
      onChange: (v: number) => handleChange("num_thread", v),
      helperText: "Threads CPU pour le calcul",
      tooltip: tooltipConfig.advanced.check_tensors,
    },
    {
      label: "Tokens Max de Prédiction",
      name: "num_predict" as const,
      type: "number" as const,
      value: config.num_predict,
      onChange: (v: number) => handleChange("num_predict", v),
      helperText: "-1 pour illimité",
      tooltip: tooltipConfig.sampling.sampler_seq,
    },
  ];

  return (
    <>
      <FormSection title="Paramètres Avancés de Base" spacing={2}>
        <Grid container spacing={2}>
          {basicFields.map((field) => (
            <Grid key={field.label} size={{ xs: 12, sm: 6 }}>
              <FormField
                {...field}
                  onChange={(_name, value) => field.onChange(Number(value))}
                  fullWidth
              />
            </Grid>
          ))}
        </Grid>
      </FormSection>

      <YaRNSection config={config} onChange={handleChange} tooltips={tooltipConfig.advanced} />

      <AdvancedOptionsSection
        config={config}
        onChange={handleChange}
        tooltips={tooltipConfig.advanced}
      />
    </>
  );
}
