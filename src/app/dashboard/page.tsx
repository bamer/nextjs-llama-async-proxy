"use client";

import { MainLayout } from "@components/layout/main-layout";
import { Typography, Box, Grid } from "@mui/material";
import { MetricsCard } from "@components/ui/metrics-card";
import { ModelsGrid } from "@components/ui/models-grid";
import { LogsViewer } from "@components/ui/logs-viewer";
import { WebSocketStatus } from "@components/ui/websocket-status";
import { useWebSocket } from "@hooks/use-websocket";
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
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12}>
            <MetricsCard />
          </Grid>
        </Grid>

        {/* Models and logs grid */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <ModelsGrid />
          </Grid>
          <Grid item xs={12} lg={4}>
            <LogsViewer />
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
}