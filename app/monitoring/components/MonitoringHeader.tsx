"use client";

import { Box, Typography, IconButton, Tooltip, CircularProgress } from "@mui/material";
import { Refresh } from "@mui/icons-material";

interface MonitoringHeaderProps {
  onRefresh: () => void;
  refreshing: boolean;
}

export function MonitoringHeader({ onRefresh, refreshing }: MonitoringHeaderProps) {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
      <div>
        <Typography variant="h3" component="h1" fontWeight="bold">
          System Monitoring
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Real-time performance and health monitoring
        </Typography>
      </div>
      <Tooltip title="Refresh metrics">
        <IconButton onClick={onRefresh} color="primary" size="large" disabled={refreshing}>
          {refreshing ? <CircularProgress size={24} color="inherit" /> : <Refresh fontSize="large" />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}
