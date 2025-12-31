"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";

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

interface ChartContainerProps {
  title: string;
  description: string;
  datasets: Dataset[];
  isDark: boolean;
  children: React.ReactNode;
  height?: number;
}

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

const MemoizedChartContainer = memo(function ChartContainer({
  title,
  description,
  datasets,
  isDark,
  children,
  height = 350
}: ChartContainerProps) {
  // Memoize card styles
  const cardStyles = useMemo(() => ({
    background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
    backdropFilter: 'blur(10px)' as const,
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
    height: '100%',
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
          {/* Wrapper Box to ensure proper width calculations */}
          <Box
            sx={{
              width: '100%',
              minHeight: height - 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {children}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

MemoizedChartContainer.displayName = 'ChartContainer';

export { MemoizedChartContainer as ChartContainer };
export type { ChartContainerProps, Dataset, ChartDataPoint };
