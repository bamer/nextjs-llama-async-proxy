import path from 'path';

/**
 * Constants used across the project.
 * Centralised to avoid hard‑coded values in multiple files.
 */

export const MODEL_NAME_REGEX = /^[a-zA-Z0-9_-]+$/; // strict whitelist for model directory names
export const DEFAULT_LAUNCH_TIMEOUT_MS = 30_000; // timeout for process start attempts
export const STATE_FILE_NAME = 'models-state.json';
export const LOG_DIR = path.join(process.cwd(), 'logs');