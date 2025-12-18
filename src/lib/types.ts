import path from 'path';

/**
 * Status of a model lifecycle.
 */
export type ModelStatus = 'idle' | 'starting' | 'started' | 'error';

/**
 * Information stored for each running model process.
 */
export interface ModelProcessInfo {
  pid: number;
  launchedAt: number;
  model: string;
}

/**
 * Extended state stored per-model.
 */
export interface ModelState {
  status: ModelStatus;
  pid?: number;
  launchedAt?: number;
  error?: string;
  [key: string]: any;
}

/**
 * Whole state map – keyed by model name.
 */
export type ExtendedState = Record<string, ModelState>;