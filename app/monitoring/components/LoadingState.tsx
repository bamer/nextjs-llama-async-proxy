"use client";

import { Box, Typography, LinearProgress } from "@mui/material";

export function LoadingState() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Loading Monitoring Data...
      </Typography>
      <LinearProgress />
    </Box>
  );
}
