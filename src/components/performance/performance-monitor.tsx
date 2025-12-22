"use client";

import { useEffect, useState } from "react";
import { useReportWebVitals } from "next/web-vitals";
import { useStore } from "../../lib/store";

interface PerformanceMetrics {
  FCP?: number;
  LCP?: number;
  FID?: number;
  CLS?: number;
  TTI?: number;
  TTFB?: number;
  timestamp: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({ timestamp: Date.now() });
  const addLog = useStore((state) => state.addLog);

  useReportWebVitals((metric) => {
    setMetrics((prev) => ({
      ...prev,
      [metric.name]: metric.value,
      timestamp: Date.now(),
    }));

    // Log performance metrics
    addLog({
      id: `perf-${metric.name}-${Date.now()}`,
      level: "info",
      message: `Performance metric: ${metric.name} = ${metric.value}`,
      timestamp: new Date().toISOString(),
      context: {
        metric: metric.name,
        value: metric.value,
        rating: getPerformanceRating(metric.name, metric.value),
      },
    });
  });

  const getPerformanceRating = (metricName: string, value: number): string => {
    switch (metricName) {
      case "FCP":
        return value <= 1000 ? "good" : value <= 3000 ? "needs-improvement" : "poor";
      case "LCP":
        return value <= 2500 ? "good" : value <= 4000 ? "needs-improvement" : "poor";
      case "FID":
        return value <= 100 ? "good" : value <= 300 ? "needs-improvement" : "poor";
      case "CLS":
        return value <= 0.1 ? "good" : value <= 0.25 ? "needs-improvement" : "poor";
      case "TTI":
        return value <= 3800 ? "good" : value <= 7300 ? "needs-improvement" : "poor";
      case "TTFB":
        return value <= 800 ? "good" : value <= 1800 ? "needs-improvement" : "poor";
      default:
        return "unknown";
    }
  };

  return null; // This component doesn't render anything
}