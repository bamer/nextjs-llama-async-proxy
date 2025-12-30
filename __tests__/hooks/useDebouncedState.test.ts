import { renderHook, act, waitFor } from "@testing-library/react";
import { useDebouncedState } from "@/hooks/useDebouncedState";

describe("useDebouncedState Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("Initialization", () => {
    it("initializes with provided value", () => {
      const { result } = renderHook(() => useDebouncedState("initial"));

      expect(result.current[0]).toBe("initial");
    });

    it("initializes debounced value with initial value", () => {
      const { result } = renderHook(() => useDebouncedState("initial"));

      expect(result.current[2]).toBe("initial");
    });

    it("initializes with number value", () => {
      const { result } = renderHook(() => useDebouncedState(42));

      expect(result.current[0]).toBe(42);
      expect(result.current[2]).toBe(42);
    });

    it("initializes with boolean value", () => {
      const { result } = renderHook(() => useDebouncedState(true));

      expect(result.current[0]).toBe(true);
      expect(result.current[2]).toBe(true);
    });

    it("initializes with null value", () => {
      const { result } = renderHook(() => useDebouncedState(null));

      expect(result.current[0]).toBeNull();
      expect(result.current[2]).toBeNull();
    });

    it("initializes with object value", () => {
      const obj = { key: "value" };
      const { result } = renderHook(() => useDebouncedState(obj));

      expect(result.current[0]).toEqual(obj);
      expect(result.current[2]).toEqual(obj);
    });

    it("uses default delay of 300ms", () => {
      const { result } = renderHook(() => useDebouncedState("initial"));

      // Value updates immediately
      act(() => {
        result.current[1]("new");
      });

      expect(result.current[0]).toBe("new");

      // Debounced value hasn't updated yet
      expect(result.current[2]).toBe("initial");

      // After 300ms
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current[2]).toBe("new");
    });

    it("uses custom delay when provided", () => {
      const { result } = renderHook(() => useDebouncedState("initial", 500));

      act(() => {
        result.current[1]("new");
      });

      expect(result.current[0]).toBe("new");
      expect(result.current[2]).toBe("initial");

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Not updated yet
      expect(result.current[2]).toBe("initial");

      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Updated after 500ms
      expect(result.current[2]).toBe("new");
    });
  });

  describe("State Updates", () => {
    it("updates value immediately", () => {
      const { result } = renderHook(() => useDebouncedState("initial"));

      act(() => {
        result.current[1]("new value");
      });

      expect(result.current[0]).toBe("new value");
    });

    it("updates debounced value after delay", () => {
      const { result } = renderHook(() => useDebouncedState("initial"));

      act(() => {
        result.current[1]("new value");
      });

      expect(result.current[2]).toBe("initial");

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current[2]).toBe("new value");
    });

    it("handles multiple rapid updates", () => {
      const { result } = renderHook(() => useDebouncedState("initial"));

      act(() => {
        result.current[1]("value 1");
        result.current[1]("value 2");
        result.current[1]("value 3");
      });

      expect(result.current[0]).toBe("value 3");
      expect(result.current[2]).toBe("initial");

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should only update to last value
      expect(result.current[2]).toBe("value 3");
    });

    it("cancels previous debounce timer", () => {
      const { result } = renderHook(() => useDebouncedState("initial"));

      act(() => {
        result.current[1]("value 1");
        jest.advanceTimersByTime(150);
        result.current[1]("value 2");
        jest.advanceTimersByTime(100);
        result.current[1]("value 3");
      });

      expect(result.current[0]).toBe("value 3");
      expect(result.current[2]).toBe("initial");

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should use last update timestamp
      expect(result.current[2]).toBe("value 3");
    });
  });

  describe("Delay Variations", () => {
    it("handles zero delay", () => {
      const { result } = renderHook(() => useDebouncedState("initial", 0));

      act(() => {
        result.current[1]("new");
      });

      // Zero delay means next tick
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current[2]).toBe("new");
    });

    it("handles very short delay", () => {
      const { result } = renderHook(() => useDebouncedState("initial", 10));

      act(() => {
        result.current[1]("new");
      });

      act(() => {
        jest.advanceTimersByTime(10);
      });

      expect(result.current[2]).toBe("new");
    });

    it("handles very long delay", () => {
      const { result } = renderHook(() => useDebouncedState("initial", 5000));

      act(() => {
        result.current[1]("new");
      });

      act(() => {
        jest.advanceTimersByTime(4000);
      });

      expect(result.current[2]).toBe("initial");

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current[2]).toBe("new");
    });
  });

  describe("Type Variations", () => {
    it("handles string type", () => {
      const { result } = renderHook(() => useDebouncedState(""));

      act(() => {
        result.current[1]("hello");
      });

      expect(result.current[0]).toBe("hello");

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current[2]).toBe("hello");
    });

    it("handles number type", () => {
      const { result } = renderHook(() => useDebouncedState(0));

      act(() => {
        result.current[1](42);
      });

      expect(result.current[0]).toBe(42);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current[2]).toBe(42);
    });

    it("handles boolean type", () => {
      const { result } = renderHook(() => useDebouncedState(false));

      act(() => {
        result.current[1](true);
      });

      expect(result.current[0]).toBe(true);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current[2]).toBe(true);
    });

    it("handles array type", () => {
      const { result } = renderHook(() => useDebouncedState([1, 2, 3]));

      act(() => {
        result.current[1]([4, 5, 6]);
      });

      expect(result.current[0]).toEqual([4, 5, 6]);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current[2]).toEqual([4, 5, 6]);
    });

    it("handles object type", () => {
      const { result } = renderHook(() =>
        useDebouncedState({ a: 1, b: 2 })
      );

      act(() => {
        result.current[1]({ c: 3, d: 4 });
      });

      expect(result.current[0]).toEqual({ c: 3, d: 4 });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current[2]).toEqual({ c: 3, d: 4 });
    });
  });

  describe("Cleanup", () => {
    it("cleans up timer on unmount", () => {
      const { result, unmount } = renderHook(() =>
        useDebouncedState("initial")
      );

      act(() => {
        result.current[1]("new");
      });

      unmount();

      // Timer should be cleared without errors
      act(() => {
        jest.advanceTimersByTime(300);
      });
    });

    it("cleans up timer on unmount before delay expires", () => {
      const { result, unmount } = renderHook(() =>
        useDebouncedState("initial")
      );

      act(() => {
        result.current[1]("new");
      });

      // Unmount before timer fires
      unmount();

      // Should not throw errors
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(300);
        });
      }).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined value", () => {
      const { result } = renderHook(() => useDebouncedState(undefined));

      act(() => {
        result.current[1](undefined);
      });

      expect(result.current[0]).toBeUndefined();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current[2]).toBeUndefined();
    });

    it("handles null value", () => {
      const { result } = renderHook(() => useDebouncedState(null));

      act(() => {
        result.current[1](null);
      });

      expect(result.current[0]).toBeNull();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current[2]).toBeNull();
    });

    it("handles empty string", () => {
      const { result } = renderHook(() => useDebouncedState("initial"));

      act(() => {
        result.current[1]("");
      });

      expect(result.current[0]).toBe("");

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current[2]).toBe("");
    });

    it("handles zero value", () => {
      const { result } = renderHook(() => useDebouncedState(100));

      act(() => {
        result.current[1](0);
      });

      expect(result.current[0]).toBe(0);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current[2]).toBe(0);
    });

    it("handles negative delay", () => {
      const { result } = renderHook(() => useDebouncedState("initial", -100));

      act(() => {
        result.current[1]("new");
      });

      // Should still work with next tick
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current[2]).toBe("new");
    });

    it("handles very long strings", () => {
      const { result } = renderHook(() => useDebouncedState("initial"));

      const longString = "A".repeat(10000);

      act(() => {
        result.current[1](longString);
      });

      expect(result.current[0]).toBe(longString);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current[2]).toBe(longString);
    });
  });

  describe("Return Value Structure", () => {
    it("returns tuple of three values", () => {
      const { result } = renderHook(() => useDebouncedState("initial"));

      expect(result.current).toHaveLength(3);
    });

    it("returns as const tuple", () => {
      const { result } = renderHook(() => useDebouncedState("initial"));

      expect(Array.isArray(result.current)).toBe(true);
    });

    it("first element is current value", () => {
      const { result } = renderHook(() => useDebouncedState("initial"));

      expect(result.current[0]).toBe("initial");
    });

    it("second element is setter function", () => {
      const { result } = renderHook(() => useDebouncedState("initial"));

      expect(typeof result.current[1]).toBe("function");
    });

    it("third element is debounced value", () => {
      const { result } = renderHook(() => useDebouncedState("initial"));

      expect(result.current[2]).toBe("initial");
    });
  });
});
