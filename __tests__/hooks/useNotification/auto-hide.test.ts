import { renderHook } from "@testing-library/react";
import { useNotification } from "@/hooks/useNotification";
import { setupNotificationHook, showNotification, advanceTimers } from "./test-utils";

describe("useNotification - Auto-hide with autoHideDelay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("closes notification after autoHideDelay", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "Auto hide message", "info", 1000);

    expect(hook.result.current.notification.open).toBe(true);

    advanceTimers(1000);

    expect(hook.result.current.notification.open).toBe(false);
  });

  it("does not close before delay", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "Message", "info", 2000);

    expect(hook.result.current.notification.open).toBe(true);

    advanceTimers(1000);

    expect(hook.result.current.notification.open).toBe(true);

    advanceTimers(1000);

    expect(hook.result.current.notification.open).toBe(false);
  });

  it("handles different delay values", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "Short delay", "info", 500);

    expect(hook.result.current.notification.open).toBe(true);

    advanceTimers(500);

    expect(hook.result.current.notification.open).toBe(false);
  });

  it("does not auto-hide when autoHideDelay is 0", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "No auto hide", "info", 0);

    expect(hook.result.current.notification.open).toBe(true);

    advanceTimers(5000);

    expect(hook.result.current.notification.open).toBe(true);
  });

  it("does not auto-hide when autoHideDelay is negative", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "No auto hide", "info", -100);

    expect(hook.result.current.notification.open).toBe(true);

    advanceTimers(5000);

    expect(hook.result.current.notification.open).toBe(true);
  });

  it("does not auto-hide when autoHideDelay is not provided", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "No auto hide");

    expect(hook.result.current.notification.open).toBe(true);

    advanceTimers(5000);

    expect(hook.result.current.notification.open).toBe(true);
  });

  it("clears timer on new notification", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "First", "info", 2000);

    advanceTimers(1000);

    expect(hook.result.current.notification.open).toBe(true);

    showNotification(hook, "Second", "info", 2000);

    advanceTimers(1000);

    expect(hook.result.current.notification.open).toBe(true);

    advanceTimers(1000);

    expect(hook.result.current.notification.open).toBe(false);
  });
});
