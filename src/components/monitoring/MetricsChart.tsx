"use client";

import { Card, CardContent, Typography, Box } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface MetricsChartProps {
  data: any[];
  title: string;
  description: string;
}

export function MetricsChart({ data, title, description }: MetricsChartProps) {
  const { isDark } = useTheme();

  return (
    <Card sx={{ 
      background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
    }}>
      <Typography variant="h5" fontWeight="bold" sx={{ p: 2 }}>
        {title}
      </Typography>
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {description}
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
            <XAxis dataKey="timestamp" stroke={isDark ? "#cbd5e1" : "#64748b"} />
            <YAxis stroke={isDark ? "#cbd5e1" : "#64748b"} />
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
            <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" name="CPU %" />
            <Area type="monotone" dataKey="memory" stroke="#a855f7" fillOpacity={1} fill="url(#colorMemory)" name="Memory %" />
            <Area type="monotone" dataKey="requests" stroke="#22c55e" fillOpacity={1} fill="url(#colorRequests)" name="Total Requests" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
