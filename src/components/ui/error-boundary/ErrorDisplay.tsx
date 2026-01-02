"use client";

import { ErrorInfo } from "react";
import { Button, Typography, Box, Card, CardContent, Alert, AlertTitle } from "@mui/material";
import { Refresh as RefreshIcon, Warning } from "@mui/icons-material";

interface ErrorDisplayProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  onReload: () => void;
}

export function ErrorDisplay({ error, errorInfo, onReset, onReload }: ErrorDisplayProps) {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        width: "100%",
        p: 4,
        backgroundColor: (theme) =>
          theme.palette.mode === "dark" ? "#0f172a" : "#f8fafc",
      }}
    >
      <Card
        sx={{
          maxWidth: 800,
          width: "100%",
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
          {/* Error Icon */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <Warning
              sx={{
                fontSize: 64,
                color: "error.main",
              }}
            />
          </Box>

          {/* Error Title */}
          <Typography variant="h4" component="h1" align="center" gutterBottom fontWeight="bold">
            Something went wrong
          </Typography>

          {/* Error Message */}
          <Typography variant="body1" color="text.secondary" align="center" mb={3}>
            {error?.message ||
              "An unexpected error occurred while rendering this component."}
          </Typography>

          {/* Alert Box */}
          <Alert severity="warning" sx={{ mb: 3 }}>
            <AlertTitle>We apologize for the inconvenience</AlertTitle>
            Please try refreshing the page. If the problem persists, contact support with the
            error details below.
          </Alert>

          {/* Development Mode: Show Error Details */}
          {isDevelopment && error && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Error Details (Development Mode):
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.05)",
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  overflow: "auto",
                  maxHeight: 300,
                }}
              >
                <Typography variant="body2" component="pre" sx={{ whiteSpace: "pre-wrap" }}>
                  {error.toString()}
                  {"\n\n"}
                  {error.stack}
                  {"\n\n"}
                  {errorInfo?.componentStack}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={onReload}
              size="large"
            >
              Reload Page
            </Button>
            <Button
              variant="outlined"
              onClick={onReset}
              size="large"
            >
              Try Again
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}