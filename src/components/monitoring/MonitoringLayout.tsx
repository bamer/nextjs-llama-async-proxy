"use client";

import { Box } from "@mui/material";
import { ReactNode } from "react";

interface MonitoringLayoutProps {
  children: ReactNode;
}

export function MonitoringLayout({ children }: MonitoringLayoutProps) {
  return (
    <Box sx={{ p: 4 }}>
      {children}
    </Box>
  );
}
