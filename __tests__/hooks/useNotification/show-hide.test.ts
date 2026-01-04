import { renderHook } from "@testing-library/react";
import { useNotification } from "@/hooks/useNotification";
import { setupNotificationHook, showNotification } from "./test-utils";

describe("useNotification - showNotification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("opens notification when called", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "Test message");

    expect(hook.result.current.notification.open).toBe(true);
    expect(hook.result.current.notification.message).toBe("Test message");
  });

  it("sets custom message", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "Custom message");

    expect(hook.result.current.notification.message).toBe("Custom message");
  });

  it("sets default severity to info", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "Message");

    expect(hook.result.current.notification.severity).toBe("info");
  });

  it("sets custom severity", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "Error message", "error");

    expect(hook.result.current.notification.severity).toBe("error");
  });

  it("handles success severity", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "Success!", "success");

    expect(hook.result.current.notification.severity).toBe("success");
  });

  it("handles warning severity", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "Warning!", "warning");

    expect(hook.result.current.notification.severity).toBe("warning");
  });

  it("handles info severity", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "Info!", "info");

    expect(hook.result.current.notification.severity).toBe("info");
  });
});

describe("useNotification - hideNotification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("closes notification when called", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "Test message");

    expect(hook.result.current.notification.open).toBe(true);

    hideNotification(hook);

    expect(hook.result.current.notification.open).toBe(false);
  });

  it("handles calling hide when notification is already closed", () => {
    const hook = setupNotificationHook();

    expect(() => {
      hideNotification(hook);
    }).not.toThrow();

    expect(hook.result.current.notification.open).toBe(false);
  });

  it("can close multiple times", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "Test message");

    hideNotification(hook);
    hideNotification(hook);
    hideNotification(hook);

    expect(hook.result.current.notification.open).toBe(false);
  });
});
