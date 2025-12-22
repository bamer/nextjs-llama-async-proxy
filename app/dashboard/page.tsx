"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Typography, Box } from "@mui/material";
import { MetricsCard } from "@/components/ui/metrics-card";
import { WebSocketStatus } from "@/components/ui/websocket-status";
import { useWebSocket } from "@/hooks/use-websocket";
import { useEffect } from "react";

export default function DashboardPage() {
  const { requestMetrics, requestModels, requestLogs } = useWebSocket();

  useEffect(() => {
    // Initial data load
    requestMetrics();
    requestModels();
    requestLogs();
  }, [requestMetrics, requestModels, requestLogs]);

  return (
    <MainLayout>
      <Box sx={{ flexGrow: 1, py: 4 }}>
        {/* Page header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Dashboard
          </Typography>
          <WebSocketStatus />
        </Box>

        {/* Metrics section */}
        <Box sx={{ mb: 4 }}>
          <MetricsCard />
        </Box>

        {/* Metrics section only for now */}
        <Box sx={{ mb: 4 }}>
          <MetricsCard />
        </Box>
      </Box>
    </MainLayout>
  );
}