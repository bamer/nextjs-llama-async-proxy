"use client";

import React, { useCallback } from "react";
import { Grid } from "@mui/material";
import { FormField } from "@/components/ui/FormField";
import FormSwitch from "@/components/ui/FormSwitch";
import SliderField from "@/components/ui/SliderField";
import { FormSection } from "@/components/ui/FormSection";
import { SamplingConfig } from "@/config/model-config-schema";
import { PARAM_DESCRIPTIONS } from "@/config/model-params-descriptions";
import { MirostatSection } from "./MirostatSection";
import { tooltipConfig } from "@/config/tooltip-config";

interface SamplingFormProps {
  config: SamplingConfig;
  onChange: (config: SamplingConfig) => void;
}

export default function SamplingForm({ config, onChange }: SamplingFormProps): React.ReactElement {
  const handleChange = useCallback(
    (field: keyof SamplingConfig, value: string | number | boolean) => {
      onChange({ ...config, [field]: value as any });
    },
    [config, onChange],
  );

  const sliderFields = [
    {
      label: "Température",
      value: config.temperature,
      onChange: (v: number) => handleChange("temperature", v),
      min: 0,
      max: 2,
      step: 0.1,
      description: tooltipConfig.sampling.temperature?.description,
    },
    {
      label: "Top P",
      value: config.top_p,
      onChange: (v: number) => handleChange("top_p", v),
      min: 0,
      max: 1,
      step: 0.05,
      description: tooltipConfig.sampling.top_p?.description,
    },
    {
      label: "Min P",
      value: config.min_p,
      onChange: (v: number) => handleChange("min_p", v),
      min: 0,
      max: 1,
      step: 0.05,
      description: tooltipConfig.sampling.min_p?.description,
    },
    {
      label: "Typical P",
      value: config.typical_p,
      onChange: (v: number) => handleChange("typical_p", v),
      min: 0,
      max: 1,
      step: 0.05,
      description: tooltipConfig.sampling.typical_p?.description,
    },
    {
      label: "Pénalité de Répétition",
      value: config.repeat_penalty,
      onChange: (v: number) => handleChange("repeat_penalty", v),
      min: 0,
      max: 2,
      step: 0.1,
      description: tooltipConfig.sampling.repeat_penalty?.description,
    },
    {
      label: "Pénalité de Fréquence",
      value: config.frequency_penalty,
      onChange: (v: number) => handleChange("frequency_penalty", v),
      min: 0,
      max: 2,
      step: 0.1,
      description: tooltipConfig.sampling.frequency_penalty?.description,
    },
    {
      label: "Pénalité de Présence",
      value: config.presence_penalty,
      onChange: (v: number) => handleChange("presence_penalty", v),
      min: 0,
      max: 2,
      step: 0.1,
      description: tooltipConfig.sampling.presence_penalty?.description,
    },
  ];

  const textFieldFields = [
    {
      label: "Top K",
      name: "top_k" as const,
      value: config.top_k,
      type: "number" as const,
      onChange: (v: number) => handleChange("top_k", v),
      helperText: "Nombre de tokens principaux à considérer",
      tooltip: tooltipConfig.sampling.top_k,
    },
    {
      label: "Répéter Dernier N",
      name: "repeat_last_n" as const,
      value: config.repeat_last_n,
      type: "number" as const,
      onChange: (v: number) => handleChange("repeat_last_n", v),
      helperText: "Tokens à pénaliser pour la répétition",
      tooltip: tooltipConfig.sampling.repeat_last_n,
    },
    {
      label: "Graine",
      name: "seed" as const,
      value: config.seed,
      type: "number" as const,
      onChange: (v: number) => handleChange("seed", v),
      helperText: "-1 pour aléatoire",
      tooltip: tooltipConfig.sampling.seed,
    },
  ];

  return (
    <>
      <FormSection title="Paramètres d'Échantillonnage" spacing={2} divider={false}>
        <Grid container spacing={2}>
          {sliderFields.map((field) => (
            <Grid key={field.label} size={{ xs: 12, sm: 6 }}>
              <SliderField {...field} />
            </Grid>
          ))}
          {textFieldFields.map((field) => (
            <Grid key={field.label} size={{ xs: 12, sm: 6 }}>
              <FormField
                label={field.label}
                name={field.name}
                value={field.value}
                type={field.type}
                helperText={field.helperText}
                tooltip={field.tooltip}
                onChange={(_name: string, value: string | number | boolean) => field.onChange(Number(value))}
                fullWidth
              />
            </Grid>
          ))}
        </Grid>
      </FormSection>

      <MirostatSection
        config={config}
        onChange={handleChange}
        descriptions={PARAM_DESCRIPTIONS.sampling}
        tooltips={tooltipConfig.sampling}
      />
    </>
  );
}
