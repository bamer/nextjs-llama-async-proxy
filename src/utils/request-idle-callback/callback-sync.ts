/**
 * Synchronous requestIdleCallback utilities
 * Provides direct browser API wrappers with fallbacks
 */

import { RequestIdleCallbackOptions, RequestIdleCallbackDeadline } from './types';

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
 * @returns Handle for canceling the callback (number or void)
 */
export function requestIdleCallback(
  callback: (deadline?: RequestIdleCallbackDeadline) => void,
  options?: RequestIdleCallbackOptions
): number | void {
  if (typeof window === 'undefined') {
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
 *
 * @param handle - Handle returned from requestIdleCallback
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
