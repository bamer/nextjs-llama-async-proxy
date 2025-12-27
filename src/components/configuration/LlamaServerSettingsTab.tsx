'use client';

import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
} from "@mui/material";
import { m } from "framer-motion";
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

  const renderSection = (title: string, fields: React.ReactNode[]) => (
    <>
      <Grid size={{ xs: 12 }}>
        <Typography
          variant="subtitle2"
          fontWeight="bold"
          sx={{ mb: 2, mt: 2, color: "primary.main" }}
        >
          {title}
        </Typography>
      </Grid>
      {fields}
    </>
  );

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <Card
        sx={{
          mb: 4,
          background: isDark
            ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
          boxShadow: isDark
            ? "0 8px 30px rgba(0, 0, 0, 0.3)"
            : "0 8px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <CardContent>
          <Typography variant="h5" fontWeight="bold" mb={4}>
            Llama-Server Settings
          </Typography>

          <Grid container spacing={3}>
            {/* Server Binding */}
            {renderSection("Server Binding", [
              <Grid key="host" size={{ xs: 12, md: 6 }}>
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
              </Grid>,
              <Grid key="port" size={{ xs: 12, md: 6 }}>
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
              </Grid>,
            ])}

            {/* Basic Options */}
            {renderSection("Basic Options", [
              <Grid key="ctx_size" size={{ xs: 12, md: 6 }}>
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
              </Grid>,
              <Grid key="batch_size" size={{ xs: 12, md: 6 }}>
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
              </Grid>,
              <Grid key="ubatch_size" size={{ xs: 12, md: 6 }}>
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
              </Grid>,
              <Grid key="threads" size={{ xs: 12, md: 6 }}>
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
              </Grid>,
            ])}

            {/* GPU Options */}
            {renderSection("GPU Options", [
              <Grid key="gpu_layers" size={{ xs: 12, md: 6 }}>
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
              </Grid>,
              <Grid key="main_gpu" size={{ xs: 12, md: 6 }}>
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
              </Grid>,
            ])}

            {/* Sampling Parameters */}
            {renderSection("Sampling Parameters", [
              <Grid key="temperature" size={{ xs: 12, md: 6 }}>
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
              </Grid>,
              <Grid key="top_k" size={{ xs: 12, md: 6 }}>
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
              </Grid>,
              <Grid key="top_p" size={{ xs: 12, md: 6 }}>
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
              </Grid>,
            ])}
          </Grid>
        </CardContent>
      </Card>
    </m.div>
  );
}
