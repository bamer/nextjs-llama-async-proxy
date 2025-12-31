/**
 * Logger convenience exports
 * Provides simplified logging interface
 */

import { getLogger } from './initialize';
import type { Logger } from 'winston';
import type { LoggerConfig } from './types';
import { initLogger, updateLoggerConfig, setSocketIOInstance, getWebSocketTransport, getLoggerConfig } from './initialize';
import { createTransports } from './transports';

// Initialize logger on import
const loggerInstance = getLogger();

// Export logger methods for convenience
export const log = {
  error: (message: string, meta?: unknown) => loggerInstance.error(message, meta),
  warn: (message: string, meta?: unknown) => loggerInstance.warn(message, meta),
  info: (message: string, meta?: unknown) => loggerInstance.info(message, meta),
  debug: (message: string, meta?: unknown) => loggerInstance.debug(message, meta),
  verbose: (message: string, meta?: unknown) => loggerInstance.verbose(message, meta),
};

// Export types
export type { Logger, LoggerConfig };

// Export initialization functions
export { initLogger, getLogger, updateLoggerConfig, setSocketIOInstance, getWebSocketTransport, getLoggerConfig, createTransports };
