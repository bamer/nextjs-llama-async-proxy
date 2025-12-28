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
  private loggerAvailable: boolean = false;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };

    // Check if client logger module is available
    if (typeof window !== "undefined") {
      try {
        this.loggerAvailable = true;
      } catch (err) {
        console.warn("[ErrorBoundary] Failed to initialize logger:", err);
        this.loggerAvailable = false;
      }
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    // Normalize error to ensure it's always an Error instance
    const errorObj = this.normalizeError(error);

    // Check if this is a non-critical initialization error
    if (this.isNonCriticalError(errorObj)) {
      console.warn("[ErrorBoundary] Ignored non-critical error:", errorObj.message);
      return;
    }

    // Log to console immediately with full context
    console.error("[ErrorBoundary] Caught an error:", {
      name: errorObj.name,
      message: errorObj.message,
      stack: errorObj.stack,
      componentStack: errorInfo.componentStack,
      error: error
    });

    // Log to client-side logger (synchronously - already loaded)
    this.logToClientLogger(errorObj, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError && errorObj instanceof Error) {
      this.props.onError(errorObj, errorInfo);
    }

    // Store error info in state for display in development
    this.setState({ error: errorObj, errorInfo });
  }

  /**
   * Normalize error to ensure it's always an Error instance
   * Handles cases where error might be string, object, or unknown type
   */
  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === "string") {
      return new Error(error);
    }

    if (error && typeof error === "object" && "message" in error) {
      // Handle objects that have a message property
      const message = String((error as { message: unknown }).message || "Unknown error");
      const normalizedError = new Error(message);
      // Attach original object as a property for debugging
      (normalizedError as Error & { originalError: unknown }).originalError = error;
      return normalizedError;
    }

    // Fallback for completely unknown error types
    return new Error(`Unknown error: ${String(error)}`);
  }

  /**
   * Check if error is a non-critical initialization or browser error
   * These errors are expected in certain scenarios and should be ignored
   */
  private isNonCriticalError(error: Error): boolean {
    const nonCriticalPatterns = [
      // Browser-specific errors
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",

      // React initialization errors (can happen during hydration)
      "Text content does not match server-rendered HTML",
      "Hydration failed",

      // Chunk loading errors (can happen during hot reload)
      "Loading CSS chunk",
      "ChunkLoadError",
      "Failed to fetch dynamically imported module",

      // Expected context errors (component will handle these)
      "useTheme must be used within a ThemeProvider",
      "useSidebar must be used within a SidebarProvider",
    ];

    return nonCriticalPatterns.some(pattern =>
      error.message?.includes(pattern) ||
      error.name?.includes(pattern)
    );
  }

  /**
   * Log error to client-side logger
   * Uses dynamic import to avoid blocking on initialization
   */
  private logToClientLogger(error: Error, errorInfo: ErrorInfo): void {
    if (!this.loggerAvailable) {
      return;
    }

    // Validate error object before logging to avoid empty objects
    const hasValidError = error && (
      error.name ||
      error.message ||
      error.stack
    );

    const hasValidErrorInfo = errorInfo && (
      errorInfo.componentStack
    );

    // Skip logging if error is empty or invalid (defensive check)
    if (!hasValidError && !hasValidErrorInfo) {
      console.warn("[ErrorBoundary] Skipping log - error object is empty or invalid");
      return;
    }

    // Try to log to client logger asynchronously (non-blocking)
    import("@/lib/client-logger").then(({ getLogger }) => {
      try {
        const logger = getLogger();
        logger.error("React Error Boundary caught an error", {
          name: error.name || "Unknown",
          message: error.message || "No message available",
          stack: error.stack || "No stack available",
          componentStack: errorInfo?.componentStack || "No component stack available",
          timestamp: new Date().toISOString(),
          url: typeof window !== "undefined" ? window.location.href : "server"
        });
      } catch (err) {
        console.error("[ErrorBoundary] Failed to log to client logger:", err);
      }
    }).catch(() => {
      // Silently fail if logger import fails
      console.debug("[ErrorBoundary] Client logger not available");
    });
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
