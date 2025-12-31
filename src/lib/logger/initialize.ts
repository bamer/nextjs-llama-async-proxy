/**
 * Logger initialization and configuration management
 */

import { createLogger, Logger } from 'winston';
import { WebSocketTransport } from '../websocket-transport';
import type { LoggerConfig } from './types';
import { logLevels } from './types';
import { createTransports } from './transports';

let loggerInstance: Logger;
let wsTransport: WebSocketTransport | null = null;

// Default configuration
let currentConfig: LoggerConfig = {
  consoleLevel: 'info',
  fileLevel: 'info',
  errorLevel: 'error',
  maxFileSize: '20m',
  maxFiles: '30d',
  enableFileLogging: true,
  enableConsoleLogging: true,
};

/**
 * Initialize logger with configuration
 */
export function initLogger(config: Partial<LoggerConfig> = {}): Logger {
  const mergedConfig = { ...currentConfig, ...config };
  currentConfig = mergedConfig;

  // Create WebSocket transport if not exists
  if (!wsTransport) {
    wsTransport = new WebSocketTransport();
  }

  // Create transports
  const loggerTransports = createTransports(currentConfig, wsTransport);

  // Create logger instance
  loggerInstance = createLogger({
    levels: logLevels,
    level: 'verbose',
    transports: loggerTransports,
    exitOnError: false,
  });

  // Configure max listeners
  if (typeof (loggerInstance as any).setMaxListeners === 'function') {
    (loggerInstance as any).setMaxListeners(20);
  }

  // Add exception handling
  if (loggerInstance.exceptions) {
    loggerInstance.exceptions.handle(...(loggerTransports as any));
  }

  // Add rejection handling
  if (loggerInstance.rejections) {
    loggerInstance.rejections.handle(...(loggerTransports as any));
  }

  loggerInstance.info('Logger initialized with configuration:', {
    consoleLevel: currentConfig.consoleLevel,
    fileLevel: currentConfig.fileLevel,
    errorLevel: currentConfig.errorLevel,
    enableFileLogging: currentConfig.enableFileLogging,
    enableConsoleLogging: currentConfig.enableConsoleLogging,
  });

  return loggerInstance;
}

/**
 * Get current logger configuration
 */
export function getLoggerConfig(): LoggerConfig {
  return { ...currentConfig };
}

/**
 * Get logger instance (create if not exists)
 */
export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = initLogger();
  }
  return loggerInstance;
}

/**
 * Update logger configuration dynamically
 */
export function updateLoggerConfig(config: Partial<LoggerConfig>): void {
  const newConfig = { ...currentConfig, ...config };

  if (JSON.stringify(newConfig) !== JSON.stringify(currentConfig)) {
    currentConfig = newConfig;
    loggerInstance?.info('Updating logger configuration:', config);
    initLogger(newConfig);
  }
}

/**
 * Set Socket.IO instance for WebSocket transport
 */
export function setSocketIOInstance(io: any): void {
  if (wsTransport) {
    wsTransport.setSocketIOInstance(io);
  }
}

/**
 * Get WebSocket transport instance
 */
export function getWebSocketTransport(): WebSocketTransport | null {
  return wsTransport;
}
