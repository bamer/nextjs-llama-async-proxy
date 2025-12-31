/**
 * Type definitions for requestIdleCallback utilities
 */

export interface RequestIdleCallbackOptions {
  timeout?: number;
}

export interface RequestIdleCallbackDeadline {
  readonly didTimeout: boolean;
  timeRemaining: () => number;
}

export interface QueuedMessage {
  event: string;
  data?: unknown;
}
