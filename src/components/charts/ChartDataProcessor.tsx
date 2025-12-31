"use client";

import { useMemo } from "react";
import type { ChartDataPoint, Dataset } from "./ChartContainer";

interface ProcessedDataPoint {
  time: string;
  [key: string]: string | number;
}

interface ProcessedDataResult {
  mergedData: ProcessedDataPoint[];
  hasValidData: boolean;
  hasValidMergedData: boolean;
  hasValidValues: boolean;
}

/**
 * Merge multiple datasets into a single array of data points
 */
function mergeDatasets(datasets: Dataset[]): ProcessedDataPoint[] {
  const firstDataset = datasets.find((d) => d.data.length > 0);
  if (!firstDataset) return [];

  return firstDataset.data.map((point, index) => {
    const merged: ProcessedDataPoint = {
      time: point.displayTime,
    };
    datasets.forEach((dataset) => {
      if (dataset.data[index]) {
        merged[dataset.dataKey] = dataset.data[index].value;
      }
    });
    return merged;
  });
}

/**
 * Check if any dataset has data and has valid data points
 */
function hasData(datasets: Dataset[]): boolean {
  const hasAnyData = datasets.some((dataset) => dataset.data.length > 0);

  // Additional check: ensure first dataset has at least 2 points for proper rendering
  if (hasAnyData) {
    const firstDataset = datasets.find((d) => d.data.length > 0);
    return firstDataset !== undefined && firstDataset.data.length >= 2;
  }

  return false;
}

/**
 * Check if merged data has enough points for rendering
 */
function hasValidMergedData(mergedData: ProcessedDataPoint[]): boolean {
  return mergedData.length >= 2;
}

/**
 * Check if any dataset has valid numeric values
 */
function hasValidValues(datasets: Dataset[]): boolean {
  return datasets.some(dataset =>
    dataset.data.some(point => typeof point.value === 'number' && !isNaN(point.value))
  );
}

/**
 * Process metrics data for chart rendering
 * Returns merged data and validation flags
 */
export function processMetricsData(datasets: Dataset[]): ProcessedDataResult {
  const mergedData = mergeDatasets(datasets);
  const validData = hasData(datasets);
  const validMergedData = hasValidMergedData(mergedData);
  const validValues = hasValidValues(datasets);

  return {
    mergedData,
    hasValidData: validData,
    hasValidMergedData: validMergedData,
    hasValidValues: validValues
  };
}

/**
 * Format data for chart series configuration
 */
export function formatDataForChart(datasets: Dataset[], isDark: boolean, showAnimation: boolean) {
  return datasets.map(s => ({
    dataKey: s.dataKey,
    label: s.label,
    showMark: false,
    disableLine: !showAnimation,
    disableCurve: !showAnimation,
    color: isDark ? s.colorDark : s.colorLight,
    valueFormatter: s.valueFormatter || ((value) => value !== null ? `${value.toFixed(1)}` : 'N/A'),
  }));
}

/**
 * Get tooltip value formatter
 */
export function getTooltipValue(value: number | null, valueFormatter?: (value: number | null) => string): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  if (valueFormatter) {
    return valueFormatter(value);
  }
  return `${value.toFixed(1)}`;
}

/**
 * Hook to process chart data
 */
export function useChartDataProcessor(datasets: Dataset[]) {
  return useMemo(() => processMetricsData(datasets), [datasets]);
}

/**
 * Hook to format data for chart
 */
export function useChartDataFormatter(datasets: Dataset[], isDark: boolean, showAnimation: boolean) {
  return useMemo(() => formatDataForChart(datasets, isDark, showAnimation), [datasets, isDark, showAnimation]);
}

export type { ProcessedDataPoint, ProcessedDataResult };
