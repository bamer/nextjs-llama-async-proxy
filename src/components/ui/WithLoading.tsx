"use client";

import React from "react";
import { Box, CircularProgress, LinearProgress, BoxProps } from "@mui/material";

export interface WithLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  variant?: "skeleton" | "spinner" | "overlay";
  sx?: BoxProps["sx"];
}

export const WithLoading: React.FC<WithLoadingProps> = ({
  loading,
  children,
  fallback,
  variant = "spinner",
  sx,
}) => {
  if (!loading) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  switch (variant) {
    case "skeleton":
      return (
        <Box sx={sx}>
          <LinearProgress />
        </Box>
      );

    case "overlay":
      return (
        <Box
          sx={{
            position: "relative",
            ...sx,
          }}
        >
          {children}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(4px)",
              bgcolor: "rgba(0, 0, 0, 0.1)",
              zIndex: 1,
            }}
          >
            <CircularProgress />
          </Box>
        </Box>
      );

    case "spinner":
    default:
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            p: 2,
            ...sx,
          }}
        >
          <CircularProgress />
        </Box>
      );
  }
};
