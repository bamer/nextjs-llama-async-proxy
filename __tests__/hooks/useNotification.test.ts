import { renderHook, act, waitFor } from "@testing-library/react";
import { useNotification } from "@/hooks/useNotification";

describe("useNotification Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("Initialization", () => {
    it("initializes with notification closed", () => {
      const { result } = renderHook(() => useNotification());

      expect(result.current.notification.open).toBe(false);
    });

    it("initializes with empty message", () => {
      const { result } = renderHook(() => useNotification());

      expect(result.current.notification.message).toBe("");
    });

    it("initializes with info severity", () => {
      const { result } = renderHook(() => useNotification());

      expect(result.current.notification.severity).toBe("info");
    });

    it("returns showNotification function", () => {
      const { result } = renderHook(() => useNotification());

      expect(typeof result.current.showNotification).toBe("function");
    });

    it("returns hideNotification function", () => {
      const { result } = renderHook(() => useNotification());

      expect(typeof result.current.hideNotification).toBe("function");
    });
  });

  describe("showNotification", () => {
    it("opens notification when called", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("Test message");
      });

      expect(result.current.notification.open).toBe(true);
      expect(result.current.notification.message).toBe("Test message");
    });

    it("sets custom message", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("Custom message");
      });

      expect(result.current.notification.message).toBe("Custom message");
    });

    it("sets default severity to info", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("Message");
      });

      expect(result.current.notification.severity).toBe("info");
    });

    it("sets custom severity", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("Error message", "error");
      });

      expect(result.current.notification.severity).toBe("error");
    });

    it("handles success severity", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("Success!", "success");
      });

      expect(result.current.notification.severity).toBe("success");
    });

    it("handles warning severity", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("Warning!", "warning");
      });

      expect(result.current.notification.severity).toBe("warning");
    });

    it("handles info severity", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("Info!", "info");
      });

      expect(result.current.notification.severity).toBe("info");
    });
  });

  describe("Auto-hide with autoHideDelay", () => {
    it("closes notification after autoHideDelay", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("Auto hide message", "info", 1000);
      });

      expect(result.current.notification.open).toBe(true);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.notification.open).toBe(false);
    });

    it("does not close before delay", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("Message", "info", 2000);
      });

      expect(result.current.notification.open).toBe(true);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.notification.open).toBe(true);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.notification.open).toBe(false);
    });

    it("handles different delay values", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("Short delay", "info", 500);
      });

      expect(result.current.notification.open).toBe(true);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.notification.open).toBe(false);
    });

    it("does not auto-hide when autoHideDelay is 0", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("No auto hide", "info", 0);
      });

      expect(result.current.notification.open).toBe(true);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.notification.open).toBe(true);
    });

    it("does not auto-hide when autoHideDelay is negative", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("No auto hide", "info", -100);
      });

      expect(result.current.notification.open).toBe(true);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.notification.open).toBe(true);
    });

    it("does not auto-hide when autoHideDelay is not provided", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("No auto hide");
      });

      expect(result.current.notification.open).toBe(true);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.notification.open).toBe(true);
    });

    it("clears timer on new notification", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("First", "info", 2000);
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.notification.open).toBe(true);

      act(() => {
        result.current.showNotification("Second", "info", 2000);
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.notification.open).toBe(true);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.notification.open).toBe(false);
    });
  });

  describe("hideNotification", () => {
    it("closes notification when called", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("Test message");
      });

      expect(result.current.notification.open).toBe(true);

      act(() => {
        result.current.hideNotification();
      });

      expect(result.current.notification.open).toBe(false);
    });

    it("handles calling hide when notification is already closed", () => {
      const { result } = renderHook(() => useNotification());

      expect(() => {
        act(() => {
          result.current.hideNotification();
        });
      }).not.toThrow();

      expect(result.current.notification.open).toBe(false);
    });

    it("can close multiple times", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("Test message");
      });

      act(() => {
        result.current.hideNotification();
        result.current.hideNotification();
        result.current.hideNotification();
      });

      expect(result.current.notification.open).toBe(false);
    });
  });

  describe("SnackbarCloseReason Handling", () => {
    it("handles clickaway reason by not closing", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("Test message");
      });

      expect(result.current.notification.open).toBe(true);

      act(() => {
        result.current.hideNotification(null, "clickaway");
      });

      expect(result.current.notification.open).toBe(true);
    });

    it("handles timeout reason by closing", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("Test message");
      });

      expect(result.current.notification.open).toBe(true);

      act(() => {
        result.current.hideNotification(null, "timeout");
      });

      expect(result.current.notification.open).toBe(false);
    });

    it("handles escapeKeyDown reason by closing", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("Test message");
      });

      expect(result.current.notification.open).toBe(true);

      act(() => {
        result.current.hideNotification(null, "escapeKeyDown");
      });

      expect(result.current.notification.open).toBe(false);
    });

    it("handles no reason by closing", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("Test message");
      });

      expect(result.current.notification.open).toBe(true);

      act(() => {
        result.current.hideNotification();
      });

      expect(result.current.notification.open).toBe(false);
    });
  });

  describe("Sequential Notifications", () => {
    it("can show multiple notifications sequentially", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("First message", "info");
      });

      expect(result.current.notification.message).toBe("First message");
      expect(result.current.notification.severity).toBe("info");

      act(() => {
        result.current.showNotification("Second message", "error");
      });

      expect(result.current.notification.message).toBe("Second message");
      expect(result.current.notification.severity).toBe("error");

      act(() => {
        result.current.showNotification("Third message", "success");
      });

      expect(result.current.notification.message).toBe("Third message");
      expect(result.current.notification.severity).toBe("success");
    });

    it("replaces previous notification", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("First", "info");
      });

      expect(result.current.notification.message).toBe("First");
      expect(result.current.notification.open).toBe(true);

      act(() => {
        result.current.showNotification("Second", "warning");
      });

      expect(result.current.notification.message).toBe("Second");
      expect(result.current.notification.severity).toBe("warning");
      expect(result.current.notification.open).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty string message", () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("");
      });

      expect(result.current.notification.message).toBe("");
      expect(result.current.notification.open).toBe(true);
    });

    it("handles very long message", () => {
      const longMessage = "A".repeat(1000);
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification(longMessage);
      });

      expect(result.current.notification.message).toBe(longMessage);
    });

    it("handles special characters in message", () => {
      const specialMessage = "Test <script>alert('xss')</script> & 'quotes'";
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification(specialMessage);
      });

      expect(result.current.notification.message).toBe(specialMessage);
    });

    it("handles unicode in message", () => {
      const unicodeMessage = "Hello 世界 🌍";
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification(unicodeMessage);
      });

      expect(result.current.notification.message).toBe(unicodeMessage);
    });
  });

  describe("State Persistence", () => {
    it("maintains state across renders", () => {
      const { result, rerender } = renderHook(() => useNotification());

      act(() => {
        result.current.showNotification("Test message", "error");
      });

      rerender();

      expect(result.current.notification.open).toBe(true);
      expect(result.current.notification.message).toBe("Test message");
      expect(result.current.notification.severity).toBe("error");
    });
  });
});
