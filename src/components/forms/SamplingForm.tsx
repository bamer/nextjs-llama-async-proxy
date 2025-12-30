"use client";

import React, { useCallback } from "react";
import { Box, Divider, Grid, Slider, TextField, Tooltip } from "@mui/material";
import FormSwitch from "@/components/ui/FormSwitch";
import SliderField from "@/components/ui/SliderField";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { SamplingConfig } from "@/config/model-config-schema";
import { PARAM_DESCRIPTIONS } from "@/components/models/ModelConfigDialog";

interface SamplingFormProps {
  config: SamplingConfig;
  onChange: (config: SamplingConfig) => void;
}

export default function SamplingForm({ config, onChange }: SamplingFormProps): JSX.Element {
  const handleChange = useCallback(
    (field: keyof SamplingConfig, value: number | string | "auto" | "on" | "off") => {
      onChange({ ...config, [field]: value });
    },
    [config, onChange],
  );

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SliderField
          label="Temperature"
          value={config.temperature}
          onChange={(v) => handleChange("temperature", v)}
          min={0}
          max={2}
          step={0.1}
          description={PARAM_DESCRIPTIONS.temperature}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SliderField
          label="Top P"
          value={config.top_p}
          onChange={(v) => handleChange("top_p", v)}
          min={0}
          max={1}
          step={0.05}
          description={PARAM_DESCRIPTIONS.top_p}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.top_k} arrow>
          <TextField
            fullWidth
            label="Top K"
            type="number"
            value={config.top_k}
            onChange={(e) => handleChange("top_k", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 0 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SliderField
          label="Min P"
          value={config.min_p}
          onChange={(v) => handleChange("min_p", v)}
          min={0}
          max={1}
          step={0.05}
          description={PARAM_DESCRIPTIONS.min_p}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SliderField
          label="Typical P"
          value={config.typical_p}
          onChange={(v) => handleChange("typical_p", v)}
          min={0}
          max={1}
          step={0.05}
          description={PARAM_DESCRIPTIONS.typical_p}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SliderField
          label="Repeat Penalty"
          value={config.repeat_penalty}
          onChange={(v) => handleChange("repeat_penalty", v)}
          min={0}
          max={2}
          step={0.1}
          description={PARAM_DESCRIPTIONS.repeat_penalty}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.repeat_last_n} arrow>
          <TextField
            fullWidth
            label="Repeat Last N"
            type="number"
            value={config.repeat_last_n}
            onChange={(e) => handleChange("repeat_last_n", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 0 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SliderField
          label="Frequency Penalty"
          value={config.frequency_penalty}
          onChange={(v) => handleChange("frequency_penalty", v)}
          min={0}
          max={2}
          step={0.1}
          description={PARAM_DESCRIPTIONS.frequency_penalty}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SliderField
          label="Presence Penalty"
          value={config.presence_penalty}
          onChange={(v) => handleChange("presence_penalty", v)}
          min={0}
          max={2}
          step={0.1}
          description={PARAM_DESCRIPTIONS.presence_penalty}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.seed} arrow>
          <TextField
            fullWidth
            label="Seed"
            type="number"
            value={config.seed}
            onChange={(e) => handleChange("seed", parseInt(e.target.value) || -1)}
            helperText="-1 for random"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.flash_attn} arrow>
          <FormControl fullWidth size="small">
            <InputLabel>flash_attn</InputLabel>
            <Select
              value={config.flash_attn}
              label="flash_attn"
              onChange={(e) => handleChange("flash_attn", e.target.value as "auto" | "on" | "off")}
            >
              <MenuItem value="auto">auto</MenuItem>
              <MenuItem value="on">on</MenuItem>
              <MenuItem value="off">off</MenuItem>
            </Select>
          </FormControl>
        </Tooltip>
      </Grid>
      <Divider sx={{ my: 2, gridColumn: "1 / -1" }} />
      <Grid size={{ xs: 12 }}>
        <Box sx={{ typography: "subtitle2", mb: 2 }}>Mirostat Sampling</Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Mirostat Mode</InputLabel>
          <Select
            value={config.mirostat}
            label="Mirostat Mode"
            onChange={(e) => handleChange("mirostat", parseInt(e.target.value as string, 10))}
          >
            <MenuItem value={0}>Disabled</MenuItem>
            <MenuItem value={1}>Mirostat</MenuItem>
            <MenuItem value={2}>Mirostat 2.0</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SliderField
          label="Mirostat Tau"
          value={config.mirostat_tau}
          onChange={(v) => handleChange("mirostat_tau", v)}
          min={0}
          max={10}
          step={0.1}
          description={PARAM_DESCRIPTIONS.mirostat_tau}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SliderField
          label="Mirostat Eta"
          value={config.mirostat_eta}
          onChange={(v) => handleChange("mirostat_eta", v)}
          min={0}
          max={1}
          step={0.01}
          description={PARAM_DESCRIPTIONS.mirostat_eta}
        />
      </Grid>
    </Grid>
  );
}
