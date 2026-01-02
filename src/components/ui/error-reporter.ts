export class ErrorReporter {
  public logToConsole(error: Error, errorInfo: React.ErrorInfo, originalError: unknown): void {
    console.error("[ErrorBoundary] Caught an error:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      error: originalError
    });
  }

  public logToClientLogger(error: Error, errorInfo: React.ErrorInfo): void {
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
        console.error("[ErrorReporter] Failed to log to client logger:", err);
      }
    }).catch(() => {
      console.debug("[ErrorReporter] Client logger not available");
    });
  }

  public validateErrorObject(error: Error, errorInfo: React.ErrorInfo): boolean {
    const hasValidError = error && (error.name || error.message || error.stack);
    const hasValidErrorInfo = errorInfo && errorInfo.componentStack;

    if (!hasValidError && !hasValidErrorInfo) {
      console.warn("[ErrorReporter] Skipping log - error object is empty or invalid");
      return false;
    }

    return true;
  }

  public reportToCustomHandler(
    error: Error,
    errorInfo: React.ErrorInfo,
    customHandler?: (error: Error, errorInfo: React.ErrorInfo) => void,
  ): void {
    if (customHandler) {
      customHandler(error, errorInfo);
    }
  }
}
