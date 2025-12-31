/**
 * Promise-based requestIdleCallback implementation
 * Provides async/await support for idle callback scheduling
 */

import { RequestIdleCallbackOptions, RequestIdleCallbackDeadline } from './types';

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
      executeCallback(callback, resolve, reject);
      return;
    }

    if ('requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(
        (deadline: RequestIdleCallbackDeadline) => {
          if (deadline.didTimeout) {
            console.debug('[requestIdleCallback] Timeout reached, executing now');
          }
          executeCallback(callback, resolve, reject);
        },
        options
      );
      return;
    }

    // Fallback: use requestAnimationFrame + setTimeout
    fallbackToRAF(callback, resolve, reject, options);
  });
}

/**
 * Execute callback with promise handling
 */
function executeCallback<T>(
  callback: () => T | Promise<T>,
  resolve: (value: T) => void,
  reject: (reason?: unknown) => void
): void {
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

/**
 * Fallback implementation using requestAnimationFrame + setTimeout
 */
function fallbackToRAF<T>(
  callback: () => T | Promise<T>,
  resolve: (value: T) => void,
  reject: (reason?: unknown) => void,
  options?: RequestIdleCallbackOptions
): void {
  let executed = false;

  if ('requestAnimationFrame' in window) {
    (window as any).requestAnimationFrame(() => {
      if (!executed) {
        executed = true;
        executeCallback(callback, resolve, reject);
      }
    });

    const timeoutMs = options?.timeout || 50;
    setTimeout(() => {
      if (!executed) {
        executed = true;
        executeCallback(callback, resolve, reject);
      }
    }, timeoutMs);
  } else {
    const timeoutMs = options?.timeout || 50;
    setTimeout(() => {
      executeCallback(callback, resolve, reject);
    }, timeoutMs);
  }
}
