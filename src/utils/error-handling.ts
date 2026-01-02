/**
 * Error handling utilities for normalizing and filtering errors
 */

/**
 * Normalize error to ensure it's always an Error instance
 * Handles cases where error might be string, object, or unknown type
 */
export function normalizeError(error: unknown): Error {
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
export function isNonCriticalError(error: Error): boolean {
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