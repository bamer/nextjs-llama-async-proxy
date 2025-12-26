"use client";

import { Card, CardContent, Typography, Box } from "@mui/material";
import { LineChart, ChartsXAxis, ChartsYAxis, ChartsGrid, ChartsTooltip } from '@mui/x-charts';
import { useTheme } from "@/contexts/ThemeContext";

interface ChartDataPoint {
  time: string;
  cpu: number;
  memory: number;
  requests: number;
  [key: string]: string | number; // Index signature for MUI charts
}

interface PerformanceChartCardProps {
  title: string;
  description: string;
  data: ChartDataPoint[];
  isDark: boolean;
  height?: number;
}

export function PerformanceChartCard({
  title,
  description,
  data,
  isDark,
  height = 350
}: PerformanceChartCardProps) {
  if (data.length === 0) {
    return (
      <Card sx={{
        background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
        height: '100%',
      }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No data available
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
      height: '100%',
    }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {description}
        </Typography>

        <LineChart
          dataset={data}
          xAxis={[{ scaleType: 'band', dataKey: 'time' }]}
          series={[
            {
              dataKey: 'cpu',
              label: 'CPU %',
              area: true,
              showMark: false,
              color: isDark ? '#60a5fa' : '#2563eb',
              valueFormatter: (value) => value !== null ? `${value.toFixed(1)}%` : 'N/A',
            },
            {
              dataKey: 'memory',
              label: 'Memory %',
              area: true,
              showMark: false,
              color: isDark ? '#4ade80' : '#16a34a',
              valueFormatter: (value) => value !== null ? `${value.toFixed(1)}%` : 'N/A',
            },
            {
              dataKey: 'requests',
              label: 'Requests',
              area: true,
              showMark: false,
              color: isDark ? '#facc15' : '#f59e0b',
              valueFormatter: (value) => value !== null ? String(value) : '0',
            },
          ]}
          margin={{ top: 5, right: 30, left: 50, bottom: 30 }}
          height={height}
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
