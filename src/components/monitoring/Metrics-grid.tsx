"use client";

import { MetricCards } from "./MetricCards";

interface MetricsGridProps {
  metrics: any;
  getStatusColor: (value: number, threshold?: number) => string;
}

export function MetricsGrid({ metrics, getStatusColor }: MetricsGridProps) {
  return <MetricCards metrics={metrics} getStatusColor={getStatusColor} />;
}
