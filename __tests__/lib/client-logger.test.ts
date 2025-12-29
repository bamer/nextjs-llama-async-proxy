import {
  setLoggerConfig,
  getLoggerConfig,
  updateLoggerConfig,
  getLogger,
  type LoggerConfig,
} from "@/lib/client-logger";

describe("client-logger", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
    jest.spyOn(console, "warn").mockImplementation();
    jest.spyOn(console, "info").mockImplementation();
    jest.spyOn(console, "debug").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("setLoggerConfig", () => {
    it("should set logger configuration", () => {
      const newConfig: Partial<LoggerConfig> = {
        consoleLevel: "warn",
        fileLevel: "error",
      };

      setLoggerConfig(newConfig);
      const config = getLoggerConfig();

      expect(config.consoleLevel).toBe("warn");
      expect(config.fileLevel).toBe("error");
    });

    it("should merge with existing configuration", () => {
      const initialConfig: Partial<LoggerConfig> = {
        consoleLevel: "debug",
      };

      setLoggerConfig(initialConfig);
      const config1 = getLoggerConfig();

      setLoggerConfig({ fileLevel: "warn" });
      const config2 = getLoggerConfig();

      expect(config2.consoleLevel).toBe("debug");
      expect(config2.fileLevel).toBe("warn");
    });
  });

  describe("getLoggerConfig", () => {
    it("should return default configuration", () => {
      setLoggerConfig({
        consoleLevel: "info",
        fileLevel: "info",
        errorLevel: "error",
        enableFileLogging: true,
        enableConsoleLogging: true,
      });

      const config = getLoggerConfig();

      expect(config).toHaveProperty("consoleLevel");
      expect(config).toHaveProperty("fileLevel");
      expect(config).toHaveProperty("errorLevel");
      expect(config).toHaveProperty("maxFileSize");
      expect(config).toHaveProperty("maxFiles");
    });

    it("should return current configuration state", () => {
      const customConfig: Partial<LoggerConfig> = {
        consoleLevel: "error",
        fileLevel: "warn",
        enableFileLogging: false,
      };

      setLoggerConfig(customConfig);
      const config = getLoggerConfig();

      expect(config.consoleLevel).toBe("error");
      expect(config.fileLevel).toBe("warn");
      expect(config.enableFileLogging).toBe(false);
    });
  });

  describe("updateLoggerConfig", () => {
    it("should update configuration and log message", () => {
      const newConfig: Partial<LoggerConfig> = {
        consoleLevel: "debug",
        fileLevel: "info",
      };

      updateLoggerConfig(newConfig);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Client Logger] Configuration updated:",
        expect.objectContaining({
          consoleLevel: "debug",
          fileLevel: "info",
        })
      );
    });

    it("should merge new config with existing", () => {
      setLoggerConfig({ consoleLevel: "info", enableFileLogging: true });

      updateLoggerConfig({ consoleLevel: "warn" });
      const config = getLoggerConfig();

      expect(config.consoleLevel).toBe("warn");
      expect(config.enableFileLogging).toBe(true);
    });
  });

  describe("getLogger", () => {
    it("should return singleton logger instance", () => {
      const logger1 = getLogger();
      const logger2 = getLogger();

      expect(logger1).toBe(logger2);
    });

    it("should have all logging methods", () => {
      const logger = getLogger();

      expect(logger).toHaveProperty("error");
      expect(logger).toHaveProperty("warn");
      expect(logger).toHaveProperty("info");
      expect(logger).toHaveProperty("debug");
      expect(typeof logger.error).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.debug).toBe("function");
    });

    it("should respect console level for error logs", () => {
      const errorSpy = jest.spyOn(console, "error");
      setLoggerConfig({ consoleLevel: "error" });

      const logger = getLogger();
      logger.error("error message");
      logger.info("info message");

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR] error message")
      );
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it("should respect console level for warn logs", () => {
      const warnSpy = jest.spyOn(console, "warn");
      setLoggerConfig({ consoleLevel: "warn" });

      const logger = getLogger();
      logger.error("error message");
      logger.warn("warn message");
      logger.info("info message");

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[WARN] warn message")
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it("should respect console level for info logs", () => {
      const infoSpy = jest.spyOn(console, "info");
      setLoggerConfig({ consoleLevel: "info" });

      const logger = getLogger();
      logger.error("error message");
      logger.warn("warn message");
      logger.info("info message");
      logger.debug("debug message");

      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO] info message")
      );
      expect(infoSpy).toHaveBeenCalledTimes(1);
    });

    it("should respect console level for debug logs", () => {
      const debugSpy = jest.spyOn(console, "debug");
      setLoggerConfig({ consoleLevel: "debug" });

      const logger = getLogger();
      logger.error("error message");
      logger.warn("warn message");
      logger.info("info message");
      logger.debug("debug message");

      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining("[DEBUG] debug message")
      );
    });

    it("should format messages with timestamp", () => {
      const errorSpy = jest.spyOn(console, "error");
      setLoggerConfig({ consoleLevel: "debug" });

      const logger = getLogger();
      logger.error("test error");

      const callArgs = errorSpy.mock.calls[0][0] as string;
      expect(callArgs).toMatch(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/);
      expect(callArgs).toContain("[ERROR]");
      expect(callArgs).toContain("test error");
    });

    it("should pass additional arguments to console methods", () => {
      const errorSpy = jest.spyOn(console, "error");
      setLoggerConfig({ consoleLevel: "debug" });

      const logger = getLogger();
      const context = { key: "value" };
      logger.error("test error", context);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR] test error"),
        context
      );
    });

    it("should not log when level is below threshold", () => {
      const debugSpy = jest.spyOn(console, "debug");
      setLoggerConfig({ consoleLevel: "error" });

      const logger = getLogger();
      logger.debug("debug message");

      expect(debugSpy).not.toHaveBeenCalled();
    });
  });
});
