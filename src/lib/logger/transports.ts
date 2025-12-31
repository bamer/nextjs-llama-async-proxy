/**
 * Logger transport factory
 * Creates and manages Winston transports
 */

import { format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import Transport from 'winston-transport';
import { WebSocketTransport } from '../websocket-transport';
import type { LoggerConfig } from './types';
import { logFormat } from './types';

/**
 * Create console transport
 */
function createConsoleTransport(config: LoggerConfig): Transport {
  return new transports.Console({
    level: config.consoleLevel,
    format: format.combine(
      format.colorize(),
      format.printf((info) => {
        return `${info.timestamp} [${info.level}]: ${info.message}`;
      })
    ),
  });
}

/**
 * Create file transports (combined and error logs)
 */
function createFileTransports(config: LoggerConfig): Transport[] {
  const fileFormat = format.combine(
    format.timestamp({ format: logFormat.combine.timestamp }),
    format.errors(logFormat.combine.errors),
    format.splat(),
    format.json()
  );

  const transportsList: Transport[] = [
    new DailyRotateFile({
      level: config.fileLevel,
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: config.maxFileSize,
      maxFiles: config.maxFiles,
      format: fileFormat,
    }),
    new DailyRotateFile({
      level: config.errorLevel,
      filename: 'logs/errors-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: config.maxFileSize,
      maxFiles: config.maxFiles,
      format: fileFormat,
    }),
  ];

  return transportsList;
}

/**
 * Create all transports for logger
 */
export function createTransports(
  config: LoggerConfig,
  wsTransport: WebSocketTransport | null
): Transport[] {
  const transportsList: Transport[] = [];

  if (config.enableConsoleLogging) {
    transportsList.push(createConsoleTransport(config));
  }

  if (config.enableFileLogging) {
    transportsList.push(...createFileTransports(config));
  }

  // Add WebSocket transport if available
  if (wsTransport) {
    transportsList.push(wsTransport as any);
  }

  return transportsList;
}

// Export types
export type { LoggerConfig };
