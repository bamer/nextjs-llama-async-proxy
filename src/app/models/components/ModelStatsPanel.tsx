"use client";

import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ModelData } from "./ModelCard";

interface ModelStatsPanelProps {
  open: boolean;
  onClose: () => void;
  model: ModelData | null;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
  progress?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subtext, color, progress }) => (
  <Box
    sx={{
      p: 2,
      borderRadius: 2,
      bgcolor: "action.hover",
      display: "flex",
      flexDirection: "column",
      gap: 0.5,
    }}
  >
    <Typography variant="body2" sx={{ color: "text.secondary" }}>
      {label}
    </Typography>
    <Typography variant="h5" sx={{ fontWeight: 600, color: color || "text.primary" }}>
      {value}
    </Typography>
    {subtext && (
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {subtext}
      </Typography>
    )}
    {progress !== undefined && (
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ mt: 1, height: 6, borderRadius: 3 }}
      />
    )}
  </Box>
);

export const ModelStatsPanel: React.FC<ModelStatsPanelProps> = ({ open, onClose, model }) => {
  // Fixed chart data for token generation visualization
  const chartData = useMemo(() => [45, 52, 48, 61, 55, 67, 72, 68, 75, 71, 78, 82, 79, 85, 88, 84, 90, 87, 92, 95], []);

  if (!model) return null;

  const memoryUsage = parseFloat(model.memoryUsed) || 0;
  const totalMemory = 32;
  const memoryProgress = (memoryUsage / totalMemory) * 100;

  const gpuUsage = 2.4;
  const totalGpu = 8;
  const gpuProgress = (gpuUsage / totalGpu) * 100;

  const cpuUsage = 45;
  const queueLength = 2;
  const avgLatency = 234;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Model Statistics
          </Typography>
          <StatusBadge status={model.status} />
        </Box>
        <IconButton onClick={onClose} aria-label="Close">
          <Typography sx={{ fontSize: 20 }}>✕</Typography>
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            {model.name}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
            {model.path}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <Chip label={model.size} size="small" variant="outlined" />
            <Chip label={model.parameters || "Unknown parameters"} size="small" variant="outlined" />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Performance Metrics
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard
              label="Tokens/sec"
              value={`${model.tokensPerSec.toFixed(1)}`}
              subtext="Generation speed"
              color="success.main"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard
              label="Active Requests"
              value={model.activeRequests}
              subtext="Concurrent requests"
              color="primary.main"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard
              label="Request Queue"
              value={queueLength}
              subtext="Pending requests"
              color="warning.main"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard
              label="Avg Latency"
              value={`${avgLatency}ms`}
              subtext="Response time"
              color="info.main"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Resource Usage
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <MetricCard
              label="Memory Usage"
              value={`${memoryUsage.toFixed(1)} GB / ${totalMemory} GB`}
              subtext={`${memoryProgress.toFixed(1)}% utilized`}
              progress={memoryProgress}
              color={memoryProgress > 80 ? "error.main" : "success.main"}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <MetricCard
              label="GPU Memory"
              value={`${gpuUsage.toFixed(1)} GB / ${totalGpu} GB`}
              subtext={`${gpuProgress.toFixed(1)}% utilized`}
              progress={gpuProgress}
              color={gpuProgress > 80 ? "error.main" : "success.main"}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Token Generation (Last Hour)
        </Typography>

        <Box
          sx={{
            height: 120,
            bgcolor: "action.hover",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Mini chart placeholder - Token generation over time
          </Typography>
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "60%",
              display: "flex",
              alignItems: "flex-end",
              gap: 0.5,
              p: 1,
            }}
          >
            {chartData.map((height, i) => (
              <Box
                key={i}
                sx={{
                  flex: 1,
                  bgcolor: "primary.main",
                  borderRadius: "4px 4px 0 0",
                  height: `${height}%`,
                  opacity: 0.7,
                }}
              />
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Last updated: Just now
          </Typography>
          <Chip label="Live" color="success" size="small" />
        </Box>
      </DialogContent>
    </Dialog>
  );
};
