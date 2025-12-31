/**
 * requestIdleCallback utility with browser fallbacks
 * Provides Promise-based wrapper for idle callback scheduling
 * Compatible with browsers that don't support requestIdleCallback
 */

interface IdleDeadline {
  didTimeout: boolean;
  timeRemaining: () => number;
}

type IdleCallback = (deadline: IdleDeadline) => void;

// Store active timeouts
const activeTimeouts = new Map<number, IdleCallback>();

let timeoutIdCounter = 0;

/**
 * Request an idle callback to run when the browser is idle
 * Falls back to setTimeout for browsers without requestIdleCallback
 */
export function requestIdleCallback(
  callback: IdleCallback,
  options?: { timeout?: number }
): number {
  const id = ++timeoutIdCounter;

  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    const actualCallback = window.requestIdleCallback as (cb: IdleCallback, opts?: any) => number;
    const actualId = actualCallback(callback, options);
    activeTimeouts.set(id, callback);
    return actualId;
  } else {
    // Fallback to setTimeout
    const timeout = options?.timeout ?? 0;
    setTimeout(() => {
      const callbackWrapper: IdleDeadline = {
        didTimeout: true,
        timeRemaining: () => 0,
      };
      callback(callbackWrapper);
      activeTimeouts.delete(id);
    }, timeout);
    activeTimeouts.set(id, callback);
    return id;
  }
}

/**
 * Cancel a pending idle callback
 */
export function cancelIdleCallback(id: number): void {
  if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
    const actualCancel = window.cancelIdleCallback as (id: number) => void;
    actualCancel(id);
  } else {
    activeTimeouts.delete(id);
  }
}

// Export for testing
export type { IdleDeadline, IdleCallback };

