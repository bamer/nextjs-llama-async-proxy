"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useStore } from "@/lib/store";
import { useChartHistory } from '@/hooks/useChartHistory';
import { useState, useCallback } from "react";
import { Box } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { MonitoringFallback } from "@/components/ui/error-fallbacks";
import { MonitoringHeader } from "./components/MonitoringHeader";
import { LoadingState } from "./components/LoadingState";
import { MetricsCharts } from "./components/MetricsCharts";
import { HealthIndicators } from "./components/HealthIndicators";
import { MetricsGrid } from "./components/MetricsGrid";

export default function MonitoringPage() {
  return (
    <ErrorBoundary fallback={<MonitoringFallback />}>
      <MonitoringContent />
    </ErrorBoundary>
  );
}

// Export for testing
export { MonitoringContent };

function MonitoringContent() {
  const metrics = useStore((state) => state.metrics);
  const { isDark } = useTheme();
  const chartHistory = useChartHistory();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Handle refresh with useCallback to keep handler stable
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    console.log('Refreshing monitoring data');
    const currentMetrics = useStore.getState().metrics;
    if (currentMetrics) {
      const updatedMetrics = {
        ...currentMetrics,
        cpu: {
          ...currentMetrics.cpu,
          usage: Math.max(5, Math.min(95, currentMetrics.cpu.usage + Math.floor(Math.random() * 10) - 5)),
        },
        memory: {
          ...currentMetrics.memory,
          used: Math.max(30, Math.min(90, currentMetrics.memory.used + Math.floor(Math.random() * 15) - 7)),
        },
      };
      useStore.getState().setMetrics(updatedMetrics);
    }
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  // Set loading to false when metrics are available
  if (metrics && loading) {
    setLoading(false);
  }

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ p: 4 }}>
          <MonitoringHeader onRefresh={handleRefresh} refreshing={refreshing} />
          <LoadingState />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ p: 4 }}>
        <MonitoringHeader onRefresh={handleRefresh} refreshing={refreshing} />

        {/* Key Metrics Cards */}
        <MetricsGrid metrics={metrics} isDark={isDark} />

        {/* System Performance Chart */}
        <MetricsCharts isDark={isDark} chartHistory={chartHistory} />

        {/* System Health Summary */}
        {metrics && <HealthIndicators metrics={metrics} isDark={isDark} />}
      </Box>
    </MainLayout>
  );
}
