"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Typography, LinearProgress, Box } from "@mui/material";
import { useMonitoringPage } from "@/hooks/use-monitoring-page";
import { SystemHealthSummary } from "@/components/monitoring/SystemHealthSummary";
import { MonitoringLayout } from "./MonitoringLayout";
import { MonitoringHeader } from "./MonitoringHeader";
import { MetricsGrid } from "./Metrics-grid";
import { MonitoringPerformanceChart } from "./PerformanceChart";

export function MonitoringContent() {
  const {
    metrics,
    refreshing,
    getStatusColor,
    formatUptime,
    handleRefresh,
  } = useMonitoringPage();

  if (!metrics) {
    return (
      <MainLayout>
        <MonitoringLayout>
          <Box>
            <Typography variant="h4" gutterBottom>Loading Monitoring Data...</Typography>
            <LinearProgress />
          </Box>
        </MonitoringLayout>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <MonitoringLayout>
        <MonitoringHeader onRefresh={handleRefresh} refreshing={refreshing} />
        <MetricsGrid metrics={metrics} getStatusColor={getStatusColor} />
        <MonitoringPerformanceChart height={400} showAnimation={false} />
        <SystemHealthSummary metrics={metrics} formatUptime={formatUptime} />
      </MonitoringLayout>
    </MainLayout>
  );
}