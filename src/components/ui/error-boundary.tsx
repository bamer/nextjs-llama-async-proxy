"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Button, Typography, Box, Card, CardContent, Alert, AlertTitle } from "@mui/material";
import { Refresh as RefreshIcon, Warning } from "@mui/icons-material";
import { ErrorClassifier } from "./error-classifier";
import { ErrorReporter } from "./error-reporter";
import { ErrorRecovery } from "./error-recovery";

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
  private classifier: ErrorClassifier;
  private reporter: ErrorReporter;
  private recovery: ErrorRecovery;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };

    this.classifier = new ErrorClassifier();
    this.reporter = new ErrorReporter();
    this.recovery = new ErrorRecovery();
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    const errorObj = this.classifier.normalizeError(error);

    if (this.classifier.isNonCriticalError(errorObj)) {
      console.warn("[ErrorBoundary] Ignored non-critical error:", errorObj.message);
      return;
    }

    this.reporter.logToConsole(errorObj, errorInfo, error);

    if (this.classifier.isLoggerAvailable()) {
      if (this.reporter.validateErrorObject(errorObj, errorInfo)) {
        this.reporter.logToClientLogger(errorObj, errorInfo);
      }
    }

    this.reporter.reportToCustomHandler(errorObj, errorInfo, this.props.onError);

    this.setState({ error: errorObj, errorInfo });
  }

  resetError = () => {
    this.recovery.resetError(this.setState.bind(this));
  };

  reloadPage = () => {
    this.recovery.reloadPage();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDevelopment = process.env.NODE_ENV === "development";
      const severity = this.state.error ? this.classifier.getSeverity(this.state.error) : 'warning';
      const suggestion = this.state.error ? this.recovery.suggestRecovery(this.state.error) : '';

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
              <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                <Warning
                  sx={{
                    fontSize: 64,
                    color: severity === 'critical' ? "error.main" : "warning.main",
                  }}
                />
              </Box>

              <Typography variant="h4" component="h1" align="center" gutterBottom fontWeight="bold">
                Something went wrong
              </Typography>

              <Typography variant="body1" color="text.secondary" align="center" mb={3}>
                {this.state.error?.message ||
                  "An unexpected error occurred while rendering this component."}
              </Typography>

              <Alert severity={severity === 'critical' ? 'error' : 'warning'} sx={{ mb: 3 }}>
                <AlertTitle>We apologize for the inconvenience</AlertTitle>
                {suggestion}
              </Alert>

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
