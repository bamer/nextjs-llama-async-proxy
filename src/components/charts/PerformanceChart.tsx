"use client";

import { memo } from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { ChartContainer, type ChartDataPoint, type Dataset } from "./ChartContainer";
import { processMetricsData, useChartDataProcessor, useChartDataFormatter } from "./ChartDataProcessor";
import { PerformanceChartCore } from "./PerformanceChartCore";

interface PerformanceChartProps {
  title: string;
  description: string;
  datasets: Dataset[];
  isDark: boolean;
  height?: number;
  xAxisType?: 'band' | 'point';
  showAnimation?: boolean;
}

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

const MemoizedPerformanceChart = memo(function PerformanceChart({
  title,
  description,
  datasets,
  isDark,
  height = 350,
  xAxisType = 'band',
  showAnimation = true
}: PerformanceChartProps) {
  // Process data using the data processor
  const { mergedData, hasValidData, hasValidMergedData, hasValidValues } = useChartDataProcessor(datasets);

  // Format series for chart
  const series = useChartDataFormatter(datasets, isDark, showAnimation);

  // Return empty state if no data or insufficient data points
  if (!hasValidData || !hasValidMergedData || !hasValidValues) {
    return <EmptyStateCard title={title} isDark={isDark} />;
  }

  return (
    <ChartContainer
      title={title}
      description={description}
      datasets={datasets}
      isDark={isDark}
      height={height}
    >
      <PerformanceChartCore
        mergedData={mergedData}
        series={series}
        datasets={datasets}
        isDark={isDark}
        height={height}
        xAxisType={xAxisType}
      />
    </ChartContainer>
  );
});

MemoizedPerformanceChart.displayName = 'PerformanceChart';

export { MemoizedPerformanceChart as PerformanceChart };
export type { PerformanceChartProps };
