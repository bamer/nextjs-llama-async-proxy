import { renderHook } from "@testing-library/react";
import { useNotification } from "@/hooks/useNotification";
import { setupNotificationHook, showNotification } from "./test-utils";

describe("useNotification - SnackbarCloseReason Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("handles clickaway reason by not closing", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "Test message");

    expect(hook.result.current.notification.open).toBe(true);

    hook.result.current.hideNotification(null, "clickaway");

    expect(hook.result.current.notification.open).toBe(true);
  });

  it("handles timeout reason by closing", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "Test message");

    expect(hook.result.current.notification.open).toBe(true);

    hook.result.current.hideNotification(null, "timeout");

    expect(hook.result.current.notification.open).toBe(false);
  });

  it("handles escapeKeyDown reason by closing", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "Test message");

    expect(hook.result.current.notification.open).toBe(true);

    hook.result.current.hideNotification(null, "escapeKeyDown");

    expect(hook.result.current.notification.open).toBe(false);
  });

  it("handles no reason by closing", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "Test message");

    expect(hook.result.current.notification.open).toBe(true);

    hook.result.current.hideNotification();

    expect(hook.result.current.notification.open).toBe(false);
  });
});
