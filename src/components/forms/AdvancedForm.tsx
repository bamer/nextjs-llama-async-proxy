"use client";

import React, { useCallback } from "react";
import { Box, Divider, Grid, TextField, Tooltip } from "@mui/material";
import FormSwitch from "@/components/ui/FormSwitch";
import SliderField from "@/components/ui/SliderField";
import { AdvancedConfig } from "@/config/model-config-schema";
import { PARAM_DESCRIPTIONS } from "@/components/models/ModelConfigDialog";

interface AdvancedFormProps {
  config: AdvancedConfig;
  onChange: (config: AdvancedConfig) => void;
}

export default function AdvancedForm({ config, onChange }: AdvancedFormProps): JSX.Element {
  const handleChange = useCallback(
    (field: keyof AdvancedConfig, value: number | boolean | string) => {
      onChange({ ...config, [field]: value });
    },
    [config, onChange],
  );

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.rope_frequency} arrow>
          <TextField
            fullWidth
            label="RoPE Frequency"
            type="number"
            value={config.rope_frequency}
            onChange={(e) => handleChange("rope_frequency", parseFloat(e.target.value) || 10000)}
            InputProps={{ inputProps: { min: 1, step: 0.1 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.rope_scale} arrow>
          <TextField
            fullWidth
            label="RoPE Scale"
            type="number"
            value={config.rope_scale}
            onChange={(e) => handleChange("rope_scale", parseFloat(e.target.value) || 1.0)}
            InputProps={{ inputProps: { min: 0, step: 0.1 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.yarn_ext_factor} arrow>
          <TextField
            fullWidth
            label="YaRN Ext Factor"
            type="number"
            value={config.yarn_ext_factor}
            onChange={(e) => handleChange("yarn_ext_factor", parseFloat(e.target.value) || -1)}
            InputProps={{ inputProps: { min: -1, step: 0.1 } }}
            helperText="-1 for disabled"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.yarn_orig_ctx} arrow>
          <TextField
            fullWidth
            label="YaRN Original Ctx"
            type="number"
            value={config.yarn_orig_ctx}
            onChange={(e) => handleChange("yarn_orig_ctx", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 0 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.yarn_attn_factor} arrow>
          <TextField
            fullWidth
            label="YaRN Attn Factor"
            type="number"
            value={config.yarn_attn_factor}
            onChange={(e) => handleChange("yarn_attn_factor", parseFloat(e.target.value) || 1.0)}
            InputProps={{ inputProps: { min: 0, step: 0.1 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.yarn_beta_fast} arrow>
          <TextField
            fullWidth
            label="YaRN Beta Fast"
            type="number"
            value={config.yarn_beta_fast}
            onChange={(e) => handleChange("yarn_beta_fast", parseInt(e.target.value) || 32)}
            InputProps={{ inputProps: { min: 1 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.yarn_beta_slow} arrow>
          <TextField
            fullWidth
            label="YaRN Beta Slow"
            type="number"
            value={config.yarn_beta_slow}
            onChange={(e) => handleChange("yarn_beta_slow", parseInt(e.target.value) || 1)}
            InputProps={{ inputProps: { min: 1 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.num_thread} arrow>
          <TextField
            fullWidth
            label="Number of Threads"
            type="number"
            value={config.num_thread}
            onChange={(e) => handleChange("num_thread", parseInt(e.target.value) || 8)}
            InputProps={{ inputProps: { min: 1 } }}
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title={PARAM_DESCRIPTIONS.num_predict} arrow>
          <TextField
            fullWidth
            label="Max Predict Tokens"
            type="number"
            value={config.num_predict}
            onChange={(e) => handleChange("num_predict", parseInt(e.target.value) || -1)}
            InputProps={{ inputProps: { min: -1 } }}
            helperText="-1 for unlimited"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Divider sx={{ my: 2, gridColumn: "1 / -1" }} />
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormSwitch
          label="swa_full"
          checked={config.swa_full}
          onChange={(_e, checked) => handleChange("swa_full", checked)}
          tooltip="Sliding window attention full"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Override tensor format" arrow>
          <TextField
            fullWidth
            label="override_tensor"
            value={config.override_tensor}
            onChange={(e) => handleChange("override_tensor", e.target.value)}
            placeholder="f16"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormSwitch
          label="cpu_moe"
          checked={config.cpu_moe}
          onChange={(_e, checked) => handleChange("cpu_moe", checked)}
          tooltip="CPU MoE layers"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Number of CPU MoE layers" arrow>
          <TextField
            fullWidth
            label="n_cpu_moe"
            type="number"
            value={config.n_cpu_moe}
            onChange={(e) => handleChange("n_cpu_moe", parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 0 } }}
            helperText="Number of MoE expert layers"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormSwitch
          label="kv_unified"
          checked={config.kv_unified}
          onChange={(_e, checked) => handleChange("kv_unified", checked)}
          tooltip="Unified KV cache"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormSwitch
          label="context_shift"
          checked={config.context_shift}
          onChange={(_e, checked) => handleChange("context_shift", checked)}
          tooltip="Context shift for long contexts"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="RPC server address" arrow>
          <TextField
            fullWidth
            label="rpc"
            value={config.rpc}
            onChange={(e) => handleChange("rpc", e.target.value)}
            placeholder="localhost:50051"
            helperText="RPC server for remote execution"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormSwitch
          label="offline"
          checked={config.offline}
          onChange={(_e, checked) => handleChange("offline", checked)}
          tooltip="Offline mode"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Tooltip title="Override KV cache settings" arrow>
          <TextField
            fullWidth
            label="override_kv"
            value={config.override_kv}
            onChange={(e) => handleChange("override_kv", e.target.value)}
            placeholder="f16"
            size="small"
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormSwitch
          label="op_offload"
          checked={config.op_offload}
          onChange={(_e, checked) => handleChange("op_offload", checked)}
          tooltip="Operator offload"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormSwitch
          label="check_tensors"
          checked={config.check_tensors}
          onChange={(_e, checked) => handleChange("check_tensors", checked)}
          tooltip="Check tensor data"
        />
      </Grid>
    </Grid>
  );
}
