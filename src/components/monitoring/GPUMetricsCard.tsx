"use client";

import { Card, CardContent, CardHeader, Typography } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import { LineChart, ChartsXAxis, ChartsYAxis, ChartsGrid, ChartsTooltip } from '@mui/x-charts';

interface GPUMetricsCardProps {
  gpuAvailable: boolean;
}

export function GPUMetricsCard({ gpuAvailable }: GPUMetricsCardProps) {
  const { isDark } = useTheme();

  if (!gpuAvailable) {
    return (
      <Card sx={{
        background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
        height: '100%'
      }}>
        <CardHeader title="GPU Performance" subheader="No GPU metrics available" />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            GPU monitoring requires NVIDIA or AMD GPU with monitoring support.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{
      background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
      height: '100%'
    }}>
      <CardHeader
        title="GPU Utilization & Power"
        subheader="Real-time GPU metrics"
      />
      <CardContent>
        <LineChart
          dataset={[
            { timestamp: '00:00', power: 0, utilization: 0 },
            { timestamp: '00:15', power: 10, utilization: 45 },
            { timestamp: '00:30', power: 15, utilization: 60 },
            { timestamp: '00:45', power: 20, utilization: 75 },
            { timestamp: '01:00', power: 18, utilization: 68 },
          ]}
          xAxis={[{ scaleType: 'band', dataKey: 'timestamp' }]}
          series={[
            { dataKey: 'power', label: 'Power (W)', area: true, stack: 'total', showMark: false, color: '#f59e0b' },
            { dataKey: 'utilization', label: 'Utilization %', area: true, stack: 'total', showMark: false, color: '#3b82f6' },
          ]}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          height={400}
        >
          <ChartsGrid />
          <ChartsXAxis tickLabelStyle={{ fill: isDark ? '#cbd5e1' : '#64748b', fontSize: 12 }} />
          <ChartsYAxis tickLabelStyle={{ fill: isDark ? '#cbd5e1' : '#64748b', fontSize: 12 }} />
          <ChartsTooltip />
        </LineChart>
      </CardContent>
    </Card>
  );
}

export default GPUMetricsCard;
