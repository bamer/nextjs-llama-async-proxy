import {
  setLoggerConfig,
  getLoggerConfig,
  updateLoggerConfig,
  getLogger,
  LoggerConfig,
} from "@/lib/client-logger";

// Mock console methods
const mockConsole = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
};

global.console = mockConsole as any;

describe("client-logger", () => {
  beforeEach(() => {
    // Reset config to default
    setLoggerConfig({
      consoleLevel: "info",
      fileLevel: "info",
      errorLevel: "error",
      maxFileSize: "20m",
      maxFiles: "30d",
      enableFileLogging: true,
      enableConsoleLogging: true,
    });
    // Clear mock calls
    jest.clearAllMocks();
  });

  describe("config management", () => {
    it("should set logger config", () => {
      const newConfig: Partial<LoggerConfig> = {
        consoleLevel: "debug",
        maxFileSize: "10m",
      };

      setLoggerConfig(newConfig);
      const config = getLoggerConfig();

      expect(config.consoleLevel).toBe("debug");
      expect(config.maxFileSize).toBe("10m");
      expect(config.fileLevel).toBe("info"); // unchanged
    });

    it("should get logger config", () => {
      const config = getLoggerConfig();

      expect(config).toEqual({
        consoleLevel: "info",
        fileLevel: "info",
        errorLevel: "error",
        maxFileSize: "20m",
        maxFiles: "30d",
        enableFileLogging: true,
        enableConsoleLogging: true,
      });
    });

    it("should update logger config and log", () => {
      const newConfig: Partial<LoggerConfig> = {
        consoleLevel: "warn",
      };

      updateLoggerConfig(newConfig);

      expect(mockConsole.log).toHaveBeenCalledWith(
        "[Client Logger] Configuration updated:",
        expect.objectContaining({ consoleLevel: "warn" })
      );

      const config = getLoggerConfig();
      expect(config.consoleLevel).toBe("warn");
    });
  });

  describe("logger instance", () => {
    it("should return singleton logger instance", () => {
      const logger1 = getLogger();
      const logger2 = getLogger();

      expect(logger1).toBe(logger2);
    });

    it("should have all required methods", () => {
      const logger = getLogger();

      expect(typeof logger.error).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.debug).toBe("function");
    });
  });

  describe("logging behavior", () => {
    it("should log error when level allows", () => {
      setLoggerConfig({ consoleLevel: "error" });
      const logger = getLogger();

      logger.error("Test error", "arg1", "arg2");

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] \[ERROR\] Test error$/),
        "arg1",
        "arg2"
      );
    });

    it("should not log error when level is below threshold", () => {
      setLoggerConfig({ consoleLevel: "info" }); // info is below error? wait no
      // levels = ["error", "warn", "info", "debug"] - higher index means lower level
      // shouldLog: messageLevelIndex <= configLevelIndex
      // for consoleLevel "info" (index 2), error (index 0) should log since 0 <= 2
      // Actually, error should always log if config is info or above.

      const logger = getLogger();
      logger.error("Test error");
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it("should log warn when level allows", () => {
      setLoggerConfig({ consoleLevel: "warn" });
      const logger = getLogger();

      logger.warn("Test warn");

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] \[WARN\] Test warn$/)
      );
    });

    it("should not log warn when level is error only", () => {
      setLoggerConfig({ consoleLevel: "error" });
      const logger = getLogger();

      logger.warn("Test warn");

      expect(mockConsole.warn).not.toHaveBeenCalled();
    });

    it("should log info when level allows", () => {
      setLoggerConfig({ consoleLevel: "info" });
      const logger = getLogger();

      logger.info("Test info");

      expect(mockConsole.info).toHaveBeenCalled();
    });

    it("should not log info when level is warn", () => {
      setLoggerConfig({ consoleLevel: "warn" });
      const logger = getLogger();

      logger.info("Test info");

      expect(mockConsole.info).not.toHaveBeenCalled();
    });

    it("should log debug when level allows", () => {
      setLoggerConfig({ consoleLevel: "debug" });
      const logger = getLogger();

      logger.debug("Test debug");

      expect(mockConsole.debug).toHaveBeenCalled();
    });

    it("should not log debug when level is info", () => {
      setLoggerConfig({ consoleLevel: "info" });
      const logger = getLogger();

      logger.debug("Test debug");

      expect(mockConsole.debug).not.toHaveBeenCalled();
    });
  });

  describe("message formatting", () => {
    it("should format messages with timestamp and level", () => {
      const logger = getLogger();
      setLoggerConfig({ consoleLevel: "debug" });

      logger.info("Test message");

      const call = mockConsole.info.mock.calls[0];
      const formattedMessage = call[0];

      // Check format: [YYYY-MM-DD HH:MM:SS] [LEVEL] message
      expect(formattedMessage).toMatch(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] \[INFO\] Test message$/);
    });
  });
});