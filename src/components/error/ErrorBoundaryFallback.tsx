"use client";

import { Card, CardContent, Typography, Box, Button } from "@mui/material";
import { Refresh } from "@mui/icons-material";

interface ErrorBoundaryFallbackProps {
  error?: Error;
  onRetry?: () => void;
  icon?: React.ReactNode;
  title?: string;
  message?: string;
}

export function ErrorBoundaryFallback({
  error,
  onRetry,
  icon,
  title = "Something went wrong",
  message = "We encountered an unexpected error. Please try again.",
}: ErrorBoundaryFallbackProps) {
  const reloadPage = () => {
    window.location.reload();
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <Box
      sx={{
        p: 4,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
      }}
    >
      <Card
        sx={{
          maxWidth: 600,
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
        <CardContent sx={{ p: 4 }}>
          {icon}
          <Typography variant="h5" gutterBottom fontWeight="bold">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {message}
          </Typography>
          {process.env.NODE_ENV === "development" && error && (
            <Typography
              variant="caption"
              color="error"
              sx={{ display: "block", mb: 2, fontFamily: "monospace" }}
            >
              {error.message}
            </Typography>
          )}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Refresh />}
              onClick={handleRetry}
              size="large"
            >
              Try Again
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={reloadPage}
              size="large"
            >
              Reload Page
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
