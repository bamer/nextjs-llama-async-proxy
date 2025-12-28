"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { LineChart, ChartsXAxis, ChartsYAxis, ChartsGrid, ChartsTooltip } from '@mui/x-charts';

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

// Extracted EmptyStateCard component
const EmptyStateCard = memo(function EmptyStateCard({
  title,
  isDark
}: {
  title: string;
  isDark: boolean;
}) {
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
});

EmptyStateCard.displayName = 'EmptyStateCard';

// Extracted LegendItem component
const LegendItem = memo(function LegendItem({
  dataset,
  isDark
}: {
  dataset: Dataset;
  isDark: boolean;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.25,
        borderRadius: 1,
        background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
      }}
    >
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: isDark ? dataset.colorDark : dataset.colorLight,
        }}
      />
      <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
        {dataset.label}
      </Typography>
    </Box>
  );
});

LegendItem.displayName = 'LegendItem';

const MemoizedPerformanceChart = memo(function PerformanceChart({
  title,
  description,
  datasets,
  isDark,
  height = 350,
  xAxisType = 'band',
  showAnimation = true
}: PerformanceChartProps) {
  // Check if any dataset has data
  const hasData = useMemo(() => datasets.some((dataset) => dataset.data.length > 0), [datasets]);

  // Return empty state if no data
  if (!hasData) {
    return <EmptyStateCard title={title} isDark={isDark} />;
  }

  // Memoize expensive data merging operation
  const mergedData = useMemo(() => {
    const firstDataset = datasets.find((d) => d.data.length > 0);
    if (!firstDataset) return [];

    return firstDataset.data.map((point, index) => {
      const merged: Record<string, string | number> = {
        time: point.displayTime,
      };
      datasets.forEach((dataset) => {
        if (dataset.data[index]) {
          merged[dataset.dataKey] = dataset.data[index].value;
        }
      });
      return merged;
    });
  }, [datasets]);

  // Memoize series configuration
  const series = useMemo(() => {
    return datasets.map(s => ({
      dataKey: s.dataKey,
      label: s.label,
      showMark: false,
      disableLine: !showAnimation,
      disableCurve: !showAnimation,
      color: isDark ? s.colorDark : s.colorLight,
      valueFormatter: s.valueFormatter || ((value) => value !== null ? `${value.toFixed(1)}` : 'N/A'),
    }));
  }, [datasets, isDark, showAnimation]);

  // Memoize card styles
  const cardStyles = useMemo(() => ({
    background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
    backdropFilter: 'blur(10px)' as const,
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
    height: '100%',
  }), [isDark]);

  // Memoize tick label style
  const tickLabelStyle = useMemo(() => ({
    fill: isDark ? '#cbd5e1' : '#64748b',
    fontSize: 12
  }), [isDark]);

  // Memoize legend items
  const legendItems = useMemo(() => {
    return datasets.map((dataset) => (
      <LegendItem key={dataset.dataKey} dataset={dataset} isDark={isDark} />
    ));
  }, [datasets, isDark]);

  return (
    <Card sx={cardStyles}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {description}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1 }}>
            {legendItems}
          </Box>
          <LineChart
            dataset={mergedData}
            xAxis={[{
              scaleType: xAxisType,
              dataKey: 'time',
              label: 'Time',
              tickLabelStyle: { fill: isDark ? '#cbd5e1' : '#64748b', fontSize: 11 }
            }]}
            yAxis={[{
              label: 'Value',
              tickLabelStyle: { fill: isDark ? '#cbd5e1' : '#64748b', fontSize: 11 }
            }]}
            series={series}
            margin={{ top: 10, right: 30, left: 60, bottom: 45 }}
            height={height - 40}
          >
            <ChartsGrid vertical={true} horizontal={true} />
            <ChartsXAxis label="Time" tickLabelStyle={tickLabelStyle} />
            <ChartsYAxis tickLabelStyle={tickLabelStyle} />
            <ChartsTooltip />
          </LineChart>
        </Box>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Deep comparison for datasets array
  // Re-render only if critical props change
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.description !== nextProps.description) return false;
  if (prevProps.isDark !== nextProps.isDark) return false;
  if (prevProps.height !== nextProps.height) return false;
  if (prevProps.xAxisType !== nextProps.xAxisType) return false;
  if (prevProps.showAnimation !== nextProps.showAnimation) return false;

  // Deep compare datasets
  if (prevProps.datasets.length !== nextProps.datasets.length) return false;

  for (let i = 0; i < prevProps.datasets.length; i++) {
    const prevDataset = prevProps.datasets[i];
    const nextDataset = nextProps.datasets[i];

    if (prevDataset.dataKey !== nextDataset.dataKey) return false;
    if (prevDataset.label !== nextDataset.label) return false;
    if (prevDataset.colorDark !== nextDataset.colorDark) return false;
    if (prevDataset.colorLight !== nextDataset.colorLight) return false;

    // Compare data arrays
    if (prevDataset.data.length !== nextDataset.data.length) return false;
    for (let j = 0; j < prevDataset.data.length; j++) {
      if (prevDataset.data[j].value !== nextDataset.data[j].value) return false;
      if (prevDataset.data[j].time !== nextDataset.data[j].time) return false;
      if (prevDataset.data[j].displayTime !== nextDataset.data[j].displayTime) return false;
    }
  }

  return true;
});

MemoizedPerformanceChart.displayName = 'PerformanceChart';

export { MemoizedPerformanceChart as PerformanceChart };
