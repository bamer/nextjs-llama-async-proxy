/**
 * Error logging utilities for client-side error logging
 */

import { ErrorInfo } from "react";

/**
 * Log error to client-side logger
 * Uses dynamic import to avoid blocking on initialization
 */
export function logErrorToClientLogger(error: Error, errorInfo: ErrorInfo): void {
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