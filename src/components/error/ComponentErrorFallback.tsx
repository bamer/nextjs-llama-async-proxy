"use client";

import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  type BoxProps,
} from "@mui/material";
import { Refresh } from "@mui/icons-material";
import type { ReactNode } from "react";

interface ComponentErrorFallbackProps extends BoxProps {
  icon?: ReactNode;
  title?: string;
  message?: string;
  onRetry?: () => void;
  showReload?: boolean;
}

export function ComponentErrorFallback({
  icon,
  title = "Component Error",
  message = "This component could not be loaded.",
  onRetry,
  showReload = true,
  ...boxProps
}: ComponentErrorFallbackProps) {
  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <Box
      {...boxProps}
      sx={{
        p: 4,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "40vh",
        ...boxProps?.sx,
      }}
    >
      <Card
        sx={{
          maxWidth: 500,
          textAlign: "center",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 8px 30px rgba(0, 0, 0, 0.3)"
              : "0 8px 30px rgba(0, 0, 0, 0.1)",
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(30, 41, 59, 0.8)"
              : "rgba(255, 255, 255, 0.95)",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {icon}
          <Typography variant="h6" gutterBottom fontWeight="bold">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {message}
          </Typography>
          <Box
            sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap" }}
          >
            {onRetry && (
              <Button variant="contained" color="primary" onClick={onRetry} size="small">
                Retry
              </Button>
            )}
            {showReload && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<Refresh />}
                onClick={reloadPage}
                size="small"
              >
                Reload Page
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
