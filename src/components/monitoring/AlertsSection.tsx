"use client";

import { Box, Typography, Chip, CircularProgress, Paper } from "@mui/material";

interface AlertsSectionProps {
  isConnected: boolean;
  lastUpdateTime: string;
}

const AlertsSection = ({ isConnected, lastUpdateTime }: AlertsSectionProps) => {
  return (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
      <Typography variant="h6" gutterBottom>
        Connection Status
      </Typography>
      <Box component="section" sx={{ display: "flex", alignItems: "center", gap: 3, mb: 2 }}>
        <CircularProgress size={20} variant="determinate" sx={{ color: isConnected ? "success.main" : "error.main" }} />
        <Chip label={isConnected ? "Connected" : "Disconnected"} color={isConnected ? "success" : "error"} size="small" />
        <Typography component="span" color="textSecondary">
          Last update: {lastUpdateTime}
        </Typography>
      </Box>
    </Paper>
  );
};

export default AlertsSection;
