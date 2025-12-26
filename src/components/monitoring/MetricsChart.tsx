'use client';

import { Card, CardContent, Typography } from '@mui/material';
import { useTheme } from '@/contexts/ThemeContext';
import { LineChart, ChartsXAxis, ChartsYAxis, ChartsGrid, ChartsTooltip } from '@mui/x-charts';

interface MetricsChartProps {
  data: { timestamp: string; cpu: number; memory: number; requests: number }[];
  title: string;
  description: string;
}

export function MetricsChart({ data, title, description }: MetricsChartProps) {
  const { isDark } = useTheme();

  return (
    <Card sx={{
      background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
    }}>
      <Typography variant="h5" fontWeight="bold" sx={{ p: 2 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {description}
      </Typography>
      <CardContent>
        <LineChart
          dataset={data}
          xAxis={[{ scaleType: 'band', dataKey: 'timestamp', valueFormatter: (value) => new Date(value).toLocaleTimeString() }]}
            series={[
              {
                dataKey: 'cpu',
                label: 'CPU %',
                area: true,
                stack: 'total',
                showMark: false,
                color: '#3b82f6',
                valueFormatter: (value) => value !== null ? `${value.toFixed(1)}%` : 'N/A',
              },
              {
                dataKey: 'memory',
                label: 'Memory %',
                area: true,
                stack: 'total',
                showMark: false,
                color: '#a855f7',
                valueFormatter: (value) => value !== null ? `${value.toFixed(1)}%` : 'N/A',
              },
              {
                dataKey: 'requests',
                label: 'Requests',
                area: true,
                stack: 'total',
                showMark: false,
                color: '#22c55e',
                valueFormatter: (value) => value !== null ? String(value) : '0',
              },
            ]}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          height={300}
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

export default MetricsChart;
