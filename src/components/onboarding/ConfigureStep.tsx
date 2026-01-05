"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Slider,
  FormControlLabel,
  Checkbox,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Chip,
  InputAdornment,
} from "@mui/material";
import MemoryIcon from "@mui/icons-material/Memory";
import SettingsIcon from "@mui/icons-material/Settings";
import StorageIcon from "@mui/icons-material/Storage";

interface ConfigState {
  modelName: string;
  maxTokens: string;
  temperature: string;
  enableStreaming: boolean;
  contextSize: number;
  gpuLayers: number;
  serverPort: string;
}

interface ConfigureStepProps {
  config: ConfigState;
  onConfigChange: (config: ConfigState) => void;
  onNext: () => void;
  onBack: () => void;
}

const SAMPLE_MODELS = [
  { name: "llama-3.2-1b-instruct.Q4_0.gguf", size: "1.2 GB", parameters: "1B" },
  { name: "llama-3.2-3b-instruct.Q4_0.gguf", size: "2.1 GB", parameters: "3B" },
  { name: "mistral-7b-instruct-v0.1.Q4_0.gguf", size: "4.1 GB", parameters: "7B" },
  { name: "codellama-7b-instruct.Q4_0.gguf", size: "4.1 GB", parameters: "7B" },
  { name: "llama-2-7b-chat.Q4_0.gguf", size: "4.1 GB", parameters: "7B" },
];

export function ConfigureStep({
  config,
  onConfigChange,
  onNext,
  onBack,
}: ConfigureStepProps) {
  const [localConfig, setLocalConfig] = useState<ConfigState>(config);
  const [selectedModelIndex, setSelectedModelIndex] = useState(-1);

  const temperatureValue = parseFloat(localConfig.temperature) || 0.7;

  useEffect(() => {
    onConfigChange(localConfig);
  }, [localConfig, onConfigChange]);

  const handleChange = (field: keyof ConfigState, value: string | number | boolean) => {
    setLocalConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleModelSelect = (index: number) => {
    const model = SAMPLE_MODELS[index];
    setSelectedModelIndex(index);
    handleChange("modelName", model.name);
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ textAlign: "center" }}>
        Configure Settings
      </Typography>
      <Typography
        color="text.secondary"
        sx={{ mb: 3, textAlign: "center" }}
      >
        Set up your model preferences and server settings
      </Typography>

      {/* Model Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MemoryIcon fontSize="small" /> Select Model
        </Typography>
        <Paper
          elevation={0}
          sx={{
            bgcolor: "action.hover",
            borderRadius: 2,
            maxHeight: 180,
            overflow: "auto",
          }}
        >
          <List disablePadding>
            {SAMPLE_MODELS.map((model, index) => (
              <ListItemButton
                key={index}
                selected={selectedModelIndex === index}
                onClick={() => handleModelSelect(index)}
                sx={{
                  borderBottom: index < SAMPLE_MODELS.length - 1 ? "1px solid" : "none",
                  borderColor: "divider",
                }}
              >
                <ListItemText
                  primary={model.name}
                  secondary={`${model.parameters} parameters • ${model.size}`}
                  primaryTypographyProps={{
                    variant: "body2",
                    sx: {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                  }}
                />
                {selectedModelIndex === index && (
                  <Chip label="Selected" size="small" color="primary" />
                )}
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Server Settings */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <StorageIcon fontSize="small" /> Server Settings
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            label="Server Port"
            type="number"
            value={localConfig.serverPort}
            onChange={(e) => handleChange("serverPort", e.target.value)}
            size="small"
            sx={{ width: 150 }}
            InputProps={{
              endAdornment: <InputAdornment position="end">port</InputAdornment>,
            }}
          />
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Model Parameters */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SettingsIcon fontSize="small" /> Model Parameters
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <TextField
            label="Max Tokens"
            type="number"
            value={localConfig.maxTokens}
            onChange={(e) => handleChange("maxTokens", e.target.value)}
            size="small"
            helperText="Maximum number of tokens to generate"
          />

          <Box>
            <Typography variant="body2" gutterBottom>
              Temperature: <strong>{temperatureValue}</strong>
            </Typography>
            <Slider
              value={temperatureValue}
              onChange={(_, value) => handleChange("temperature", String(value))}
              min={0}
              max={1}
              step={0.1}
              marks={[
                { value: 0, label: "0" },
                { value: 0.5, label: "0.5" },
                { value: 1, label: "1" },
              ]}
            />
            <Typography variant="caption" color="text.secondary">
              Higher values = more creative, lower = more focused
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" gutterBottom>
              Context Size: <strong>{localConfig.contextSize}</strong>
            </Typography>
            <Slider
              value={localConfig.contextSize}
              onChange={(_, value) => handleChange("contextSize", value as number)}
              min={512}
              max={8192}
              step={512}
              marks={[
                { value: 512, label: "512" },
                { value: 2048, label: "2K" },
                { value: 4096, label: "4K" },
                { value: 8192, label: "8K" },
              ]}
            />
            <Typography variant="caption" color="text.secondary">
              Number of tokens for context window
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" gutterBottom>
              GPU Layers: <strong>{localConfig.gpuLayers}</strong>
            </Typography>
            <Slider
              value={localConfig.gpuLayers}
              onChange={(_, value) => handleChange("gpuLayers", value as number)}
              min={0}
              max={100}
              step={5}
              marks={[
                { value: 0, label: "0" },
                { value: 50, label: "50%" },
                { value: 100, label: "All" },
              ]}
            />
            <Typography variant="caption" color="text.secondary">
              Layers to offload to GPU (0 = CPU only)
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={localConfig.enableStreaming}
                onChange={(e) => handleChange("enableStreaming", e.target.checked)}
              />
            }
            label="Enable Streaming"
          />
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mt: 3,
          pt: 2,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Button variant="outlined" onClick={onBack}>
          Back
        </Button>
        <Button variant="contained" onClick={onNext}>
          Continue
        </Button>
      </Box>
    </Box>
  );
}
