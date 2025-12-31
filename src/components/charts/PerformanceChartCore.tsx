"use client";

import { memo, useMemo } from "react";
import { LineChart, ChartsXAxis, ChartsYAxis, ChartsGrid, ChartsTooltip } from '@mui/x-charts';
import { Box } from "@mui/material";
import type { ChartDataPoint, Dataset } from "./ChartContainer";
import type { ProcessedDataPoint } from "./ChartDataProcessor";

interface PerformanceChartCoreProps {
  mergedData: ProcessedDataPoint[];
  series: Array<{
    dataKey: string;
    label: string;
    showMark: boolean;
    disableLine: boolean;
    disableCurve: boolean;
    color: string;
    valueFormatter: (value: number | null) => string;
  }>;
  datasets: Dataset[];
  isDark: boolean;
  height?: number;
  xAxisType?: 'band' | 'point';
}

const MemoizedPerformanceChartCore = memo(function PerformanceChartCore({
  mergedData,
  series,
  datasets,
  isDark,
  height = 350,
  xAxisType = 'band'
}: PerformanceChartCoreProps) {
  // Memoize tick label style
  const tickLabelStyle = useMemo(() => ({
    fill: isDark ? '#cbd5e1' : '#64748b',
    fontSize: 12
  }), [isDark]);

  // Get first dataset's yAxisLabel if available
  const yAxisLabel = useMemo(() => {
    return datasets[0]?.yAxisLabel || 'Value';
  }, [datasets]);

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: height - 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <LineChart
        key={`chart-${mergedData.length}-${datasets.length}`}
        dataset={mergedData}
        xAxis={[{
          scaleType: xAxisType,
          dataKey: 'time',
          label: 'Time',
          tickLabelStyle: { fill: isDark ? '#cbd5e1' : '#64748b', fontSize: 11 }
        }]}
        yAxis={[{
          label: yAxisLabel,
          tickLabelStyle: { fill: isDark ? '#cbd5e1' : '#64748b', fontSize: 11 }
        }]}
        series={series}
        margin={{ top: 10, right: 30, left: 60, bottom: 45 }}
        height={height - 40}
        sx={{
          width: '100%',
          minHeight: 300
        }}
      >
        <ChartsGrid vertical={true} horizontal={true} />
        <ChartsXAxis label="Time" tickLabelStyle={tickLabelStyle} />
        <ChartsYAxis tickLabelStyle={tickLabelStyle} />
        <ChartsTooltip />
      </LineChart>
    </Box>
  );
});

MemoizedPerformanceChartCore.displayName = 'PerformanceChartCore';

export { MemoizedPerformanceChartCore as PerformanceChartCore };
