import { renderHook } from "@testing-library/react";
import { useNotification } from "@/hooks/useNotification";
import { setupNotificationHook, showNotification } from "./test-utils";

describe("useNotification - Sequential Notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("can show multiple notifications sequentially", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "First message", "info");

    expect(hook.result.current.notification.message).toBe("First message");
    expect(hook.result.current.notification.severity).toBe("info");

    showNotification(hook, "Second message", "error");

    expect(hook.result.current.notification.message).toBe("Second message");
    expect(hook.result.current.notification.severity).toBe("error");

    showNotification(hook, "Third message", "success");

    expect(hook.result.current.notification.message).toBe("Third message");
    expect(hook.result.current.notification.severity).toBe("success");
  });

  it("replaces previous notification", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "First", "info");

    expect(hook.result.current.notification.message).toBe("First");
    expect(hook.result.current.notification.open).toBe(true);

    showNotification(hook, "Second", "warning");

    expect(hook.result.current.notification.message).toBe("Second");
    expect(hook.result.current.notification.severity).toBe("warning");
    expect(hook.result.current.notification.open).toBe(true);
  });
});

describe("useNotification - State Persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("maintains state across renders", () => {
    const { result, rerender } = renderHook(() => useNotification());

    showNotification(result, "Test message", "error");

    rerender();

    expect(result.current.notification.open).toBe(true);
    expect(result.current.notification.message).toBe("Test message");
    expect(result.current.notification.severity).toBe("error");
  });
});
