/**
 * Logger types and configuration
 */

import type { Logger } from 'winston';

export interface LoggerConfig {
  consoleLevel: 'error' | 'info' | 'warn' | 'debug';
  fileLevel: 'error' | 'info' | 'warn' | 'debug';
  errorLevel: 'error' | 'warn';
  maxFileSize: string;
  maxFiles: string;
  enableFileLogging: boolean;
  enableConsoleLogging: boolean;
}

// Define log levels
export const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  verbose: 4,
};

// Log format
export const logFormat = {
  combine: {
    timestamp: 'YYYY-MM-DD HH:mm:ss',
    errors: { stack: true },
  },
};
