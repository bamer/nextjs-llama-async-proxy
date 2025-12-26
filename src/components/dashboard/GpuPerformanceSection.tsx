"use client";

import { Box, Typography } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";

interface GpuPerformanceSectionProps {
  gpuAvailable?: boolean;
  metrics?: {
    gpuUsage?: number;
    gpuName?: string;
    gpuMemoryUsed?: number;
    gpuMemoryTotal?: number;
    gpuMemoryUsage?: number;
    gpuPowerUsage?: number;
    gpuPowerLimit?: number;
    gpuTemperature?: number;
  };
  isDark: boolean;
}

export function GpuPerformanceSection({
  gpuAvailable = false,
  metrics,
  isDark
}: GpuPerformanceSectionProps) {
  if (!gpuAvailable) {
    return (
      <Box
        sx={{
          p: 3,
          background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
          borderRadius: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" fontWeight="bold" mb={3}>
          GPU Performance
        </Typography>
        <Typography variant="body2" color="text.secondary">
          GPU monitoring requires NVIDIA or AMD GPU with monitoring support.
        </Typography>
      </Box>
    );
  }

  const gpuUsage = metrics?.gpuUsage || 0;
  const gpuName = metrics?.gpuName || 'NVIDIA GPU';
  const gpuMemoryUsed = metrics?.gpuMemoryUsed || 0;
  const gpuMemoryTotal = metrics?.gpuMemoryTotal || 8;
  const gpuMemoryUsage = metrics?.gpuMemoryUsage || 0;
  const gpuPowerUsage = metrics?.gpuPowerUsage || 0;
  const gpuPowerLimit = metrics?.gpuPowerLimit || 0;
  const gpuTemperature = metrics?.gpuTemperature || 0;

  return (
    <Box
      sx={{
        p: 3,
        background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
        borderRadius: 2,
      }}
    >
      <Typography variant="h6" fontWeight="bold" mb={3}>
        GPU Performance
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {gpuName}
        </Typography>
      </Box>
    </Box>
  );
}
