"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Button, Typography, Box, Card, CardContent, Alert, AlertTitle } from "@mui/material";
import { Refresh as RefreshIcon, Warning } from "@mui/icons-material";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Log to client-side logger
    if (typeof window !== "undefined") {
      try {
        import("@/lib/client-logger").then(({ getLogger }) => {
          const logger = getLogger();
          logger.error("React Error Boundary caught an error", {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
          });
        }).catch(() => {
          console.error("React Error Boundary caught an error", error, errorInfo);
        });
      } catch (err) {
        console.error("Error in logger import", err);
      }
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Store error info in state for display in development
    this.setState({ errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  reloadPage = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

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
                {this.state.error?.message ||
                  "An unexpected error occurred while rendering this component."}
              </Typography>

              {/* Alert Box */}
              <Alert severity="warning" sx={{ mb: 3 }}>
                <AlertTitle>We apologize for the inconvenience</AlertTitle>
                Please try refreshing the page. If the problem persists, contact support with the
                error details below.
              </Alert>

              {/* Development Mode: Show Error Details */}
              {isDevelopment && this.state.error && (
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
                      {this.state.error.toString()}
                      {"\n\n"}
                      {this.state.error.stack}
                      {"\n\n"}
                      {this.state.errorInfo?.componentStack}
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
                  onClick={this.reloadPage}
                  size="large"
                >
                  Reload Page
                </Button>
                <Button
                  variant="outlined"
                  onClick={this.resetError}
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

    return this.props.children;
  }
}