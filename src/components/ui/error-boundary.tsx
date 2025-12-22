"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Button, Typography, Box } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    // You can also log the error to an error reporting service
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            width: "100vw",
            p: 4,
            textAlign: "center",
          }}
        >
          <Typography variant="body1" color="text.secondary" mb={3} maxWidth="600px">
            We apologize for the inconvenience. Please try refreshing the page or contact
            support if the problem persists.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={this.resetError}
            size="large"
          >
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}