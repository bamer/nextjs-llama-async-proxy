export class ErrorClassifier {
  private loggerAvailable: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        this.loggerAvailable = true;
      } catch (err) {
        console.warn("[ErrorClassifier] Failed to initialize:", err);
        this.loggerAvailable = false;
      }
    }
  }

  public normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === "string") {
      return new Error(error);
    }

    if (error && typeof error === "object" && "message" in error) {
      const message = String((error as { message: unknown }).message || "Unknown error");
      const normalizedError = new Error(message);
      (normalizedError as Error & { originalError: unknown }).originalError = error;
      return normalizedError;
    }

    return new Error(`Unknown error: ${String(error)}`);
  }

  public isNonCriticalError(error: Error): boolean {
    const nonCriticalPatterns = [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Text content does not match server-rendered HTML",
      "Hydration failed",
      "Loading CSS chunk",
      "ChunkLoadError",
      "Failed to fetch dynamically imported module",
      "useTheme must be used within a ThemeProvider",
      "useSidebar must be used within a SidebarProvider",
    ];

    return nonCriticalPatterns.some(pattern =>
      error.message?.includes(pattern) ||
      error.name?.includes(pattern)
    );
  }

  public getSeverity(error: Error): 'critical' | 'warning' | 'info' {
    if (this.isNonCriticalError(error)) {
      return 'info';
    }

    const criticalPatterns = ['SecurityError', 'NetworkError', 'TypeError:'];
    const warningPatterns = ['DeprecationWarning', 'React Warning:'];

    if (criticalPatterns.some(pattern => error.name?.includes(pattern))) {
      return 'critical';
    }

    if (warningPatterns.some(pattern => error.message?.includes(pattern))) {
      return 'warning';
    }

    return 'warning';
  }

  public isLoggerAvailable(): boolean {
    return this.loggerAvailable;
  }
}
