import { createLogger, format, transports, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { WebSocketTransport } from './websocket-transport';
import { Server } from 'socket.io';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  verbose: 4,
};

// Log format
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Logger configuration interface
export interface LoggerConfig {
  consoleLevel: 'error' | 'info' | 'warn' | 'debug';
  fileLevel: 'error' | 'info' | 'warn' | 'debug';
  errorLevel: 'error' | 'warn';
  maxFileSize: string;
  maxFiles: string;
  enableFileLogging: boolean;
  enableConsoleLogging: boolean;
}

// Create logger instance
let logger: Logger;

// WebSocket transport instance
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
  
  // Create transports array
  const loggerTransports = [];
  
  // Add console transport if enabled
  if (currentConfig.enableConsoleLogging) {
    loggerTransports.push(
      new transports.Console({
        level: currentConfig.consoleLevel,
        format: format.combine(
          format.colorize(),
          format.printf((info) => {
            return `${info.timestamp} [${info.level}]: ${info.message}`;
          })
        ),
      })
    );
  }
  
  // Add file transports if enabled
  if (currentConfig.enableFileLogging) {
    loggerTransports.push(
      new DailyRotateFile({
        level: currentConfig.fileLevel,
        filename: 'logs/application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: currentConfig.maxFileSize,
        maxFiles: currentConfig.maxFiles,
        format: logFormat,
      })
    );
  
    loggerTransports.push(
      new DailyRotateFile({
        level: currentConfig.errorLevel,
        filename: 'logs/errors-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: currentConfig.maxFileSize,
        maxFiles: currentConfig.maxFiles,
        format: logFormat,
      })
    );
  }

  // Add WebSocket transport for real-time streaming
  if (!wsTransport) {
    wsTransport = new WebSocketTransport();
  }
  loggerTransports.push(wsTransport as any);

  // Create logger instance
  logger = createLogger({
    levels: logLevels,
    level: 'verbose',
    transports: loggerTransports,
    exitOnError: false,
  });

  // Increase max listeners to prevent memory leak warnings
  // Multiple transports + exception/rejection handlers can exceed default limit of 10
  if (typeof (logger as any).setMaxListeners === 'function') {
    (logger as any).setMaxListeners(20);
  }

  // Add exception handling
  if (logger.exceptions) {
    logger.exceptions.handle(
      ...(loggerTransports as any)
    );
  }

  // Add rejection handling
  if (logger.rejections) {
    logger.rejections.handle(
      ...(loggerTransports as any)
    );
  }

  logger.info('Logger initialized with configuration:', {
    consoleLevel: currentConfig.consoleLevel,
    fileLevel: currentConfig.fileLevel,
    errorLevel: currentConfig.errorLevel,
    enableFileLogging: currentConfig.enableFileLogging,
    enableConsoleLogging: currentConfig.enableConsoleLogging,
  });

  return logger;
}

/**
 * Update logger configuration dynamically
 */
export function updateLoggerConfig(config: Partial<LoggerConfig>): void {
  const newConfig = { ...currentConfig, ...config };

  if (JSON.stringify(newConfig) !== JSON.stringify(currentConfig)) {
    currentConfig = newConfig;
    logger?.info('Updating logger configuration:', config);

    // Reinitialize logger with new configuration
    initLogger(newConfig);
  }
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
  if (!logger) {
    logger = initLogger();
  }
  return logger;
}

/**
 * Set Socket.IO instance for WebSocket transport
 * This should be called when the Socket.IO server is initialized
 */
export function setSocketIOInstance(io: Server): void {
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

// Initialize logger on import
const loggerInstance = initLogger();

// Export logger methods for convenience
export const log = {
  error: (message: string, meta?: any) => loggerInstance.error(message, meta),
  warn: (message: string, meta?: any) => loggerInstance.warn(message, meta),
  info: (message: string, meta?: any) => loggerInstance.info(message, meta),
  debug: (message: string, meta?: any) => loggerInstance.debug(message, meta),
  verbose: (message: string, meta?: any) => loggerInstance.verbose(message, meta),
};

// Export types
export type { Logger };
