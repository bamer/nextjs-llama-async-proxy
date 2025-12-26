"use client";

import { Card, CardContent, Typography, Box } from "@mui/material";
import { LineChart, ChartsXAxis, ChartsYAxis, ChartsGrid, ChartsTooltip } from '@mui/x-charts';
import { useTheme } from "@/contexts/ThemeContext";

interface ChartDataPoint {
  time: string;
  displayTime: string;
  value: number;
}

interface Dataset {
  dataKey: string;
  label: string;
  colorDark: string;
  colorLight: string;
  valueFormatter?: (value: number | null) => string;
  yAxisLabel?: string;
  data: ChartDataPoint[];
}

interface PerformanceChartProps {
  title: string;
  description: string;
  datasets: Dataset[];
  isDark: boolean;
  height?: number;
  xAxisType?: 'band' | 'point';
  showAnimation?: boolean;
}

export function PerformanceChart({
  title,
  description,
  datasets,
  isDark,
  height = 350,
  xAxisType = 'band',
  showAnimation = true
}: PerformanceChartProps) {
  const hasData = datasets.some((dataset) => dataset.data.length > 0);

  if (!hasData) {
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

  const firstDataset = datasets.find((d) => d.data.length > 0);
  const mergedData = firstDataset ? firstDataset.data.map((point, index) => {
    const merged: Record<string, string | number> = {
      time: point.displayTime,
    };
    datasets.forEach((dataset) => {
      if (dataset.data[index]) {
        merged[dataset.dataKey] = dataset.data[index].value;
      }
    });
    return merged;
  }) : [];

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
          dataset={mergedData}
          xAxis={[{
            scaleType: xAxisType,
            dataKey: 'time',
            tickLabelStyle: { fill: isDark ? '#cbd5e1' : '#64748b', fontSize: 11 }
          }]}
          series={datasets.map(s => ({
            dataKey: s.dataKey,
            label: s.label,
            showMark: false,
            disableLine: !showAnimation,
            disableCurve: !showAnimation,
            color: isDark ? s.colorDark : s.colorLight,
            valueFormatter: s.valueFormatter || ((value) => value !== null ? `${value.toFixed(1)}` : 'N/A'),
            yAxisLabel: s.yAxisLabel || undefined,
          }))}
          margin={{ top: 10, right: 30, left: 60, bottom: 30 }}
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
