import { renderHook, act } from "@testing-library/react";
import { useNotification } from "@/hooks/useNotification";
import { setupNotificationHook, showNotification, hideNotification, advanceTimers } from "./test-utils";

describe("useNotification - Initialization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("initializes with notification closed", () => {
    const hook = setupNotificationHook();

    expect(hook.result.current.notification.open).toBe(false);
  });

  it("initializes with empty message", () => {
    const hook = setupNotificationHook();

    expect(hook.result.current.notification.message).toBe("");
  });

  it("initializes with info severity", () => {
    const hook = setupNotificationHook();

    expect(hook.result.current.notification.severity).toBe("info");
  });

  it("returns showNotification function", () => {
    const hook = setupNotificationHook();

    expect(typeof hook.result.current.showNotification).toBe("function");
  });

  it("returns hideNotification function", () => {
    const hook = setupNotificationHook();

    expect(typeof hook.result.current.hideNotification).toBe("function");
  });
});
