/**
 * Shared test utilities for useNotification hook tests
 */

import { renderHook, act } from "@testing-library/react";
import { useNotification } from "@/hooks/useNotification";

export function setupNotificationHook() {
  return renderHook(() => useNotification());
}

export function showNotification(
  hook: ReturnType<typeof setupNotificationHook>,
  message: string,
  severity: "info" | "success" | "warning" | "error" = "info",
  autoHideDelay = 0
): void {
  act(() => {
    hook.result.current.showNotification(message, severity, autoHideDelay);
  });
}

export function hideNotification(
  hook: ReturnType<typeof setupNotificationHook>
): void {
  act(() => {
    hook.result.current.hideNotification();
  });
}

export function advanceTimers(ms: number): void {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}
