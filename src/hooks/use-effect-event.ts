"use client";

import { useRef, useCallback } from "react";

/**
 * React 19.2 experimental useEffectEvent polyfill.
 *
 * Creates a stable callback that always has access to latest values
 * from enclosing component's render scope, without triggering re-renders.
 *
 * @param handler - The event handler function
 * @returns A stable callback reference
 *
 * @example
 * ```tsx
 * const handleClick = useEffectEvent((id: string) => {
 *   // Can access latest state/props without recreating
 *   console.log('Clicked', id, state);
 * });
 *
 * useEffect(() => {
 *   element.addEventListener('click', handleClick);
 *   return () => element.removeEventListener('click', handleClick);
 * }, []); // Empty deps - handleClick is stable!
 * ```
 */
export function useEffectEvent<T extends (...args: any[]) => any>(handler: T): T {
  const handlerRef = useRef<T>(handler);
  // Always update to latest handler
  handlerRef.current = handler;

  // Return stable callback that delegates to latest ref value
  return useCallback((...args: any[]) => {
    return handlerRef.current(...args);
  }, []) as T;
}
