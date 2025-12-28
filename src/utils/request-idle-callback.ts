/**
 * requestIdleCallback utility with browser fallbacks
 * Provides Promise-based wrapper for idle callback scheduling
 * Compatible with browsers that don't support requestIdleCallback
 */

interface RequestIdleCallbackOptions {
  timeout?: number;
}

interface RequestIdleCallbackDeadline {
  readonly didTimeout: boolean;
  timeRemaining: () => number;
}

/**
 * Execute a callback when browser is idle
 * Falls back to setTimeout for browsers without requestIdleCallback support
 *
 * @param callback - Function to execute when browser is idle
 * @param options - Options including timeout (max wait time in ms)
 * @returns Promise that resolves when callback is executed
 */
export function requestIdleCallbackPromise<T = void>(
  callback: () => T | Promise<T>,
  options?: RequestIdleCallbackOptions
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (typeof window === 'undefined') {
      // Server-side: execute immediately
      try {
        const result = callback();
        if (result instanceof Promise) {
          result.then(resolve).catch(reject);
        } else {
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
      return;
    }

    // Check for modern browser API
    if ('requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(
        (deadline: RequestIdleCallbackDeadline) => {
          try {
            if (deadline.didTimeout) {
              console.debug('[requestIdleCallback] Timeout reached, executing now');
            }
            const result = callback();
            if (result instanceof Promise) {
              result.then(resolve).catch(reject);
            } else {
              resolve(result);
            }
          } catch (error) {
            reject(error);
          }
        },
        options
      );
      return;
    }

    // Fallback: use requestAnimationFrame + setTimeout
    let executed = false;

    // Try requestAnimationFrame first (runs before next repaint)
    if ('requestAnimationFrame' in window) {
      (window as any).requestAnimationFrame(() => {
        if (!executed) {
          executed = true;
          try {
            const result = callback();
            if (result instanceof Promise) {
              result.then(resolve).catch(reject);
            } else {
              resolve(result);
            }
          } catch (error) {
            reject(error);
          }
        }
      });

      // Fallback timeout: execute after specified time if RAF hasn't fired
      const timeoutMs = options?.timeout || 50;
      setTimeout(() => {
        if (!executed) {
          executed = true;
          try {
            const result = callback();
            if (result instanceof Promise) {
              result.then(resolve).catch(reject);
            } else {
              resolve(result);
            }
          } catch (error) {
            reject(error);
          }
        }
      }, timeoutMs);
    } else {
      // Ultimate fallback: setTimeout only
      const timeoutMs = options?.timeout || 50;
      setTimeout(() => {
        try {
          const result = callback();
          if (result instanceof Promise) {
            result.then(resolve).catch(reject);
          } else {
            resolve(result);
          }
        } catch (error) {
          reject(error);
        }
      }, timeoutMs);
    }
  });
}

/**
 * Check if requestIdleCallback is supported in current browser
 */
export function isRequestIdleCallbackSupported(): boolean {
  return typeof window !== 'undefined' && 'requestIdleCallback' in window;
}

/**
 * Simple wrapper around requestIdleCallback for sync callbacks
 * Similar to window.requestIdleCallback but returns void
 *
 * @param callback - Function to execute when browser is idle
 * @param options - Options including timeout
 */
export function requestIdleCallback(
  callback: (deadline?: RequestIdleCallbackDeadline) => void,
  options?: RequestIdleCallbackOptions
): number | void {
  if (typeof window === 'undefined') {
    // Server-side: execute immediately
    callback();
    return;
  }

  if ('requestIdleCallback' in window) {
    return (window as any).requestIdleCallback(callback, options);
  }

  // Fallback to setTimeout
  const timeoutMs = options?.timeout || 50;
  const handle = setTimeout(() => {
    callback({ didTimeout: true, timeRemaining: () => 0 });
  }, timeoutMs) as unknown as number;

  return handle;
}

/**
 * Cancel a pending requestIdleCallback
 */
export function cancelIdleCallback(handle: number | void): void {
  if (typeof handle === 'number' && typeof window !== 'undefined') {
    if ('cancelIdleCallback' in window) {
      (window as any).cancelIdleCallback(handle);
    } else {
      clearTimeout(handle);
    }
  }
}

/**
 * Execute multiple tasks in idle periods
 * Tasks are executed one at a time, with idle checks between each
 *
 * @param tasks - Array of tasks to execute
 * @param options - Options including timeout per task
 * @returns Promise that resolves when all tasks are complete
 */
export function runTasksInIdle<T>(
  tasks: Array<() => T | Promise<T>>,
  options?: RequestIdleCallbackOptions
): Promise<T[]> {
  return new Promise<T[]>((resolve, reject) => {
    const results: T[] = [];
    let currentIndex = 0;

    const executeNext = async () => {
      if (currentIndex >= tasks.length) {
        resolve(results);
        return;
      }

      try {
        const result = await tasks[currentIndex]();
        results.push(result);
        currentIndex++;
        await requestIdleCallbackPromise(executeNext, options);
      } catch (error) {
        reject(error);
      }
    };

    requestIdleCallbackPromise(executeNext, options);
  });
}
