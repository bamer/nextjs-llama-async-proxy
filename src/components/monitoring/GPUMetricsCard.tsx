"use client";

import { Card, CardContent, CardHeader, Typography, Box } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import { ResponsiveContainer, ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, Bar, XAxis as ComposedXAxis, YAxis as ComposedYAxis } from 'recharts';

interface GPUMetricsCardProps {
  data: any[];
  gpuAvailable: boolean;
}

export function GPUMetricsCard({ data, gpuAvailable }: GPUMetricsCardProps) {
  const { isDark } = useTheme();

  if (!gpuAvailable) {
    return (
      <Card sx={{ 
        background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
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
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      height: '100%'
    }}>
      <CardHeader 
        title="GPU Utilization & Power"
        subheader="Real-time GPU metrics"
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="colorUtilization" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
            <ComposedXAxis dataKey="timestamp" stroke={isDark ? "#cbd5e1" : "#64748b"} />
            <ComposedYAxis yAxisId="left" stroke={isDark ? "#cbd5e1" : "#64748b"} />
            <ComposedYAxis yAxisId="right" orientation="right" stroke={isDark ? "#cbd5e1" : "#64748b"} />
            <RechartsTooltip 
              contentStyle={{
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                borderRadius: '8px',
                color: isDark ? '#f1f5f9' : '#1e293b'
              }}
              labelStyle={{ color: isDark ? '#cbd5e1' : '#64748b' }}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar yAxisId="right" dataKey="gpuPower" fill="#f59e0b" name="Power (W)" barSize={20} />
            <Area yAxisId="left" type="monotone" dataKey="gpuUtilization" stroke="#3b82f6" fillOpacity={0.3} fill="url(#colorUtilization)" name="GPU Utilization %" />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
