export interface LoggerConfig {
  consoleLevel: "error" | "info" | "warn" | "debug";
  fileLevel: "error" | "info" | "warn" | "debug";
  errorLevel: "error" | "warn";
  maxFileSize: string;
  maxFiles: string;
  enableFileLogging: boolean;
  enableConsoleLogging: boolean;
}

let currentConfig: LoggerConfig = {
  consoleLevel: "info",
  fileLevel: "info",
  errorLevel: "error",
  maxFileSize: "20m",
  maxFiles: "30d",
  enableFileLogging: true,
  enableConsoleLogging: true,
};

export function setLoggerConfig(config: Partial<LoggerConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

export function getLoggerConfig(): LoggerConfig {
  return currentConfig;
}

export function updateLoggerConfig(config: Partial<LoggerConfig>): void {
  currentConfig = { ...currentConfig, ...config };
  console.log("[Client Logger] Configuration updated:", currentConfig);
}

export interface Logger {
  error: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
}

const levels = ["error", "warn", "info", "debug"];

const shouldLog = (level: string): boolean => {
  const configLevelIndex = levels.indexOf(currentConfig.consoleLevel);
  const messageLevelIndex = levels.indexOf(level as (typeof levels)[number]);
  return messageLevelIndex <= configLevelIndex;
};

const formatMessage = (
  level: string,
  message: string
): string => {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

let loggerInstance: Logger | null = null;

export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = {
      error: (message: string, ...args: unknown[]) => {
        if (shouldLog("error")) {
          console.error(formatMessage("error", message), ...args);
        }
      },
      warn: (message: string, ...args: unknown[]) => {
        if (shouldLog("warn")) {
          console.warn(formatMessage("warn", message), ...args);
        }
      },
      info: (message: string, ...args: unknown[]) => {
        if (shouldLog("info")) {
          console.info(formatMessage("info", message), ...args);
        }
      },
      debug: (message: string, ...args: unknown[]) => {
        if (shouldLog("debug")) {
          console.debug(formatMessage("debug", message), ...args);
        }
      },
    };
  }
  return loggerInstance;
}
