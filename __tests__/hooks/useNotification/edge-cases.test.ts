import { renderHook } from "@testing-library/react";
import { useNotification } from "@/hooks/useNotification";
import { setupNotificationHook, showNotification } from "./test-utils";

describe("useNotification - Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("handles empty string message", () => {
    const hook = setupNotificationHook();

    showNotification(hook, "");

    expect(hook.result.current.notification.message).toBe("");
    expect(hook.result.current.notification.open).toBe(true);
  });

  it("handles very long message", () => {
    const hook = setupNotificationHook();
    const longMessage = "A".repeat(1000);

    showNotification(hook, longMessage);

    expect(hook.result.current.notification.message).toBe(longMessage);
  });

  it("handles special characters in message", () => {
    const hook = setupNotificationHook();
    const specialMessage = "Test <script>alert('xss')</script> & 'quotes'";

    showNotification(hook, specialMessage);

    expect(hook.result.current.notification.message).toBe(specialMessage);
  });

  it("handles unicode in message", () => {
    const hook = setupNotificationHook();
    const unicodeMessage = "Hello 世界 🌍";

    showNotification(hook, unicodeMessage);

    expect(hook.result.current.notification.message).toBe(unicodeMessage);
  });
});
