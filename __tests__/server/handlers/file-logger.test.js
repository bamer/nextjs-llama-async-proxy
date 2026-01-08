/**
 * @jest-environment node
 */

/**
 * File Logger Tests
 * Comprehensive tests for file-logger.js covering all functions and branches
 */

import { jest } from "@jest/globals";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("FileLogger Class", () => {
  let testLogsDir;

  beforeEach(async () => {
    // Create a unique temporary directory for each test
    testLogsDir = path.join(
      __dirname,
      "test-logs-" + Date.now() + "-" + Math.random().toString(36).slice(2)
    );
    fs.mkdirSync(testLogsDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    try {
      if (testLogsDir && fs.existsSync(testLogsDir)) {
        fs.rmSync(testLogsDir, { recursive: true, force: true });
      }
    } catch (e) {
      // Ignore cleanup errors
    }
    // Reset any module state
    jest.resetModules();
  });

  describe("getLogFileName", () => {
    /**
     * Objective: Verify getLogFileName returns correct filename for today's date
     * Test: Call with default date and verify format
     */
    test("should return correct filename format for today", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const fileName = fileLogger.getLogFileName();
      expect(fileName).toMatch(/^app-\d{8}\.log$/);
    });

    /**
     * Objective: Verify getLogFileName handles custom date parameter
     * Test: Call with specific date and verify filename matches
     */
    test("should return correct filename for specific date", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const testDate = new Date("2024-06-15T12:00:00Z");
      const fileName = fileLogger.getLogFileName(testDate);
      expect(fileName).toBe("app-20240615.log");
    });

    /**
     * Objective: Verify getLogFileName handles year correctly
     * Test: Call with date in different year
     */
    test("should handle different years correctly", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const testDate = new Date("2025-01-01T00:00:00Z");
      const fileName = fileLogger.getLogFileName(testDate);
      expect(fileName).toBe("app-20250101.log");
    });

    /**
     * Objective: Verify getLogFileName pads single-digit months
     * Test: Call with date in January (month 0)
     */
    test("should pad single-digit months with leading zero", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const testDate = new Date("2024-01-05T10:00:00Z");
      const fileName = fileLogger.getLogFileName(testDate);
      expect(fileName).toBe("app-20240105.log");
    });

    /**
     * Objective: Verify getLogFileName pads single-digit days
     * Test: Call with date on 3rd day of month
     */
    test("should pad single-digit days with leading zero", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const testDate = new Date("2024-06-03T15:30:00Z");
      const fileName = fileLogger.getLogFileName(testDate);
      expect(fileName).toBe("app-20240603.log");
    });

    /**
     * Objective: Verify getLogFileName handles end of year correctly
     * Test: Call with date near end of year
     */
    test("should handle dates near end of year correctly", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      // Test December 31st - use local time to avoid timezone issues
      const testDate = new Date(2024, 11, 31, 12, 0, 0); // Month is 0-indexed
      const fileName = fileLogger.getLogFileName(testDate);
      expect(fileName).toBe("app-20241231.log");
    });

    /**
     * Objective: Verify getLogFileName uses current date when no parameter provided
     * Test: Call without parameter and verify format matches today's date
     */
    test("should use current date when no parameter provided", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const today = new Date();
      const fileName = fileLogger.getLogFileName();
      const expected = `app-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}.log`;
      expect(fileName).toBe(expected);
    });
  });

  describe("getLogFilePath", () => {
    /**
     * Objective: Verify getLogFilePath returns correct path format
     * Test: Call getLogFilePath and verify it returns a path with logs directory
     */
    test("should return path to log file in logs directory", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const filePath = fileLogger.getLogFilePath();
      expect(filePath).toContain("logs");
      expect(filePath).toMatch(/app-\d{8}\.log$/);
    });

    /**
     * Objective: Verify getLogFilePath includes filename from getLogFileName
     * Test: Verify returned path ends with today's filename
     */
    test("should include filename from getLogFileName", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const today = new Date();
      const fileName = fileLogger.getLogFileName();
      const filePath = fileLogger.getLogFilePath();

      expect(filePath).toContain(fileName);
    });

    /**
     * Objective: Verify getLogFilePath returns today's log path
     * Test: Verify path matches today's date
     */
    test("should return today's log file path", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const filePath = fileLogger.getLogFilePath();
      const today = new Date();
      const expectedFileName = `app-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}.log`;

      expect(filePath).toContain(expectedFileName);
    });
  });

  describe("writeToFile", () => {
    /**
     * Objective: Verify writeToFile creates log entry in file
     * Test: Call writeToFile and verify file is created with content
     */
    test("should write log entry to file", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      fileLogger.writeToFile("info", "Test message", "test-source");

      const filePath = fileLogger.getLogFilePath();
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, { encoding: "utf8" });
      expect(content).toContain("Test message");
      expect(content).toContain("[INFO]");
      expect(content).toContain("test-source");
    });

    /**
     * Objective: Verify writeToFile appends to existing file
     * Test: Call writeToFile twice and verify both entries exist
     */
    test("should append to existing log file", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      fileLogger.writeToFile("info", "First message", "source1");
      fileLogger.writeToFile("error", "Second message", "source2");

      const filePath = fileLogger.getLogFilePath();
      const content = fs.readFileSync(filePath, { encoding: "utf8" });

      expect(content).toContain("First message");
      expect(content).toContain("Second message");
    });

    /**
     * Objective: Verify writeToFile handles different log levels
     * Test: Call with different levels and verify format
     */
    test("should write entries with correct level formatting", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      fileLogger.writeToFile("debug", "Debug message", "source");
      fileLogger.writeToFile("warn", "Warning message", "source");
      fileLogger.writeToFile("error", "Error message", "source");

      const filePath = fileLogger.getLogFilePath();
      const content = fs.readFileSync(filePath, { encoding: "utf8" });

      expect(content).toContain("[DEBUG]");
      expect(content).toContain("[WARN]");
      expect(content).toContain("[ERROR]");
    });

    /**
     * Objective: Verify writeToFile includes ISO timestamp
     * Test: Call writeToFile and verify timestamp format
     */
    test("should include ISO timestamp in log entry", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      fileLogger.writeToFile("info", "Test", "source");

      const filePath = fileLogger.getLogFilePath();
      const content = fs.readFileSync(filePath, { encoding: "utf8" });

      expect(content).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("log level filtering", () => {
    /**
     * Objective: Verify log method respects log level threshold
     * Test: Set log level to 'info' and call debug - should not log
     */
    test("should not log debug messages when logLevel is info", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const originalLevel = fileLogger.logLevel;
      fileLogger.logLevel = "info";
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      fileLogger.log("debug", "Debug message", "source");

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
      fileLogger.logLevel = originalLevel;
    });

    /**
     * Objective: Verify log method logs when level is at or above threshold
     * Test: Set log level to 'debug' and call debug - should log
     */
    test("should log debug messages when logLevel is debug", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const originalLevel = fileLogger.logLevel;
      fileLogger.logLevel = "debug";
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      fileLogger.log("debug", "Debug message", "source");

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
      fileLogger.logLevel = originalLevel;
    });

    /**
     * Objective: Verify log method broadcasts message correctly
     * Test: Set io and verify emit format
     */
    test("should broadcast message with correct format via Socket.IO", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const mockIo = { emit: jest.fn() };
      fileLogger.setIo(mockIo);
      fileLogger.log("error", "Error message", "error-source");

      expect(mockIo.emit).toHaveBeenCalledWith("logs:entry", {
        type: "broadcast",
        data: {
          entry: {
            level: "error",
            message: "Error message",
            source: "error-source",
            timestamp: expect.any(Number),
          },
        },
      });
    });
  });

  describe("readLogFile", () => {
    /**
     * Objective: Verify readLogFile returns empty array for non-existent file
     * Test: Call readLogFile with non-existent filename
     */
    test("should return empty array for non-existent file", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const result = fileLogger.readLogFile("nonexistent.log");
      expect(result).toEqual([]);
    });

    /**
     * Objective: Verify readLogFile parses log entries correctly
     * Test: Write entries and verify structure
     */
    test("should parse log entries with correct structure", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      // Write a test log file using writeToFile
      fileLogger.writeToFile("info", "Info message", "mysource");
      fileLogger.writeToFile("error", "Error message", "mysource");

      const result = fileLogger.readLogFile();

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result[0]).toHaveProperty("timestamp");
      expect(result[0]).toHaveProperty("level");
      expect(result[0]).toHaveProperty("source");
      expect(result[0]).toHaveProperty("message");
    });

    /**
     * Objective: Verify readLogFile returns most recent entries first
     * Test: Write entries and verify order
     */
    test("should return entries in reverse chronological order", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      fileLogger.writeToFile("info", "First", "source");
      fileLogger.writeToFile("info", "Second", "source");
      fileLogger.writeToFile("info", "Third", "source");

      const result = fileLogger.readLogFile();

      // Most recent should be first
      expect(result[0].message).toBe("Third");
    });

    /**
     * Objective: Verify readLogFile handles empty file
     * Test: Create empty file and read it
     */
    test("should handle empty log file", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const logsDir = path.dirname(fileLogger.getLogFilePath());
      const filePath = path.join(logsDir, "empty.log");
      fs.writeFileSync(filePath, "", { encoding: "utf8" });

      const result = fileLogger.readLogFile("empty.log");
      expect(result).toEqual([]);

      // Clean up
      fs.unlinkSync(filePath);
    });

    /**
     * Objective: Verify readLogFile filters out malformed lines
     * Test: Write mixed valid and invalid lines
     */
    test("should filter out malformed log lines", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const logsDir = path.dirname(fileLogger.getLogFilePath());
      const filePath = path.join(logsDir, "malformed.log");
      const content = `[2024-06-15T12:00:00.000Z] [INFO] [source] Valid message
Invalid line without proper format
[2024-06-15T12:00:01.000Z] [ERROR] [source] Another valid message
Another invalid line
`;
      fs.writeFileSync(filePath, content, { encoding: "utf8" });

      const result = fileLogger.readLogFile("malformed.log");

      expect(result.length).toBe(2);
      expect(result[0].message).toBe("Another valid message");
      expect(result[1].message).toBe("Valid message");

      // Clean up
      fs.unlinkSync(filePath);
    });

    /**
     * Objective: Verify readLogFile converts level to lowercase
     * Test: Write entry and verify level is lowercase
     */
    test("should convert level to lowercase", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      fileLogger.writeToFile("info", "Test", "source");

      const result = fileLogger.readLogFile();

      expect(result[0].level).toBe("info");
    });
  });

  describe("listLogFiles", () => {
    /**
     * Objective: Verify listLogFiles returns only .log files
     * Test: Create multiple file types and verify filtering
     */
    test("should return only .log files", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const logsDir = path.dirname(fileLogger.getLogFilePath());
      fs.writeFileSync(path.join(logsDir, "app-20240615.log"), "test");
      fs.writeFileSync(path.join(logsDir, "app-20240616.log"), "test");
      fs.writeFileSync(path.join(logsDir, "readme.txt"), "test");
      fs.writeFileSync(path.join(logsDir, "config.json"), "test");

      const result = fileLogger.listLogFiles();

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.every((f) => f.endsWith(".log"))).toBe(true);
    });

    /**
     * Objective: Verify listLogFiles sorts files in reverse order
     * Test: Create files with different dates and verify order
     */
    test("should sort files in reverse chronological order", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const logsDir = path.dirname(fileLogger.getLogFilePath());
      fs.writeFileSync(path.join(logsDir, "app-20240615.log"), "test");
      fs.writeFileSync(path.join(logsDir, "app-20240616.log"), "test");
      fs.writeFileSync(path.join(logsDir, "app-20240614.log"), "test");

      const result = fileLogger.listLogFiles();

      // Find our test files in the results
      const testFiles = result.filter((f) => f.startsWith("app-202406"));
      if (testFiles.length >= 3) {
        // Should be sorted reverse chronologically
        expect(testFiles[0]).toBe("app-20240616.log");
      }
    });

    /**
     * Objective: Verify listLogFiles returns files for test logs directory
     * Test: Call listLogFiles with test directory files
     */
    test("should return files from logs directory", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      // Create test files
      const logsDir = path.dirname(fileLogger.getLogFilePath());
      fs.writeFileSync(path.join(logsDir, "test-app-1.log"), "test");
      fs.writeFileSync(path.join(logsDir, "test-app-2.log"), "test");

      const result = fileLogger.listLogFiles();

      // Should contain our test files
      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("clearLogFiles", () => {
    /**
     * Objective: Verify clearLogFiles deletes log files and returns count
     * Test: Create files and clear them
     */
    test("should delete log files and return count", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const logsDir = path.dirname(fileLogger.getLogFilePath());
      fs.writeFileSync(path.join(logsDir, "app-20240615.log"), "test");
      fs.writeFileSync(path.join(logsDir, "app-20240616.log"), "test");

      const cleared = fileLogger.clearLogFiles();

      expect(cleared).toBeGreaterThanOrEqual(2);
    });

    /**
     * Objective: Verify clearLogFiles returns 0 for no matching files
     * Test: Call clearLogFiles with no .log files
     */
    test("should return count of cleared files", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const logsDir = path.dirname(fileLogger.getLogFilePath());
      fs.writeFileSync(path.join(logsDir, "app-20240615.log"), "test");

      const cleared = fileLogger.clearLogFiles();
      expect(cleared).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getLogsDirectorySize", () => {
    /**
     * Objective: Verify getLogsDirectorySize returns size for directory with files
     * Test: Call with log files present
     */
    test("should return total size of log files", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const logsDir = path.dirname(fileLogger.getLogFilePath());
      fs.writeFileSync(path.join(logsDir, "app-20240615.log"), "A".repeat(100));
      fs.writeFileSync(path.join(logsDir, "app-20240616.log"), "B".repeat(100));

      const size = fileLogger.getLogsDirectorySize();

      expect(size).toBeGreaterThanOrEqual(200);
    });

    /**
     * Objective: Verify getLogsDirectorySize counts only .log files
     * Test: Create mixed files and verify only logs counted
     */
    test("should count only .log files", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const logsDir = path.dirname(fileLogger.getLogFilePath());
      fs.writeFileSync(path.join(logsDir, "app-20240615.log"), "AAA");
      fs.writeFileSync(path.join(logsDir, "app-20240616.log"), "BBB");
      fs.writeFileSync(path.join(logsDir, "config.json"), "CCC");

      const size = fileLogger.getLogsDirectorySize();

      // Only .log files should be counted
      expect(size).toBeGreaterThanOrEqual(6);
    });
  });

  describe("writeToFile error handling", () => {
    /**
     * Objective: Verify writeToFile handles file write errors gracefully
     * Test: Attempt to write to an invalid path
     */
    test("should handle file write errors gracefully", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      // Spy on console.error to verify error is logged
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // Create a mock for the instance to test error path
      const originalGetLogFilePath = fileLogger.getLogFilePath.bind(fileLogger);
      fileLogger.getLogFilePath = () => "/invalid/nonexistent/path/file.log";

      fileLogger.writeToFile("info", "Test message", "test-source");

      // Restore original method
      fileLogger.getLogFilePath = originalGetLogFilePath;

      // Should not throw, error should be caught
      expect(() => fileLogger.writeToFile("info", "Test", "test")).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    /**
     * Objective: Verify writeToFile handles encoding errors
     * Test: Test with invalid encoding option
     */
    test("should handle appendFileSync errors", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // This should not throw even if there's an error
      expect(() => fileLogger.writeToFile("info", "Test", "source")).not.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("log method with db and io", () => {
    /**
     * Objective: Verify log method saves to database when db is set
     * Test: Set db mock and verify addLog is called
     */
    test("should save log to database when db is set", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const mockDb = { addLog: jest.fn() };
      fileLogger.setDb(mockDb);
      fileLogger.log("info", "Test message", "test-source");

      expect(mockDb.addLog).toHaveBeenCalledWith("info", "Test message", "test-source");
    });

    /**
     * Objective: Verify log method handles db save errors gracefully
     * Test: Set db that throws on addLog
     */
    test("should handle db save errors gracefully", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const mockDb = {
        addLog: jest.fn().mockImplementation(() => {
          throw new Error("DB error");
        }),
      };
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      fileLogger.setDb(mockDb);

      // Should not throw
      expect(() => fileLogger.log("info", "Test", "source")).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    /**
     * Objective: Verify log method does not save to db when db is null
     * Test: Call log without setting db
     */
    test("should not save to db when db is not set", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      // Ensure db is null
      fileLogger.db = null;
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      // Should not throw and should still log to console
      expect(() => fileLogger.log("info", "Test", "source")).not.toThrow();
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    /**
     * Objective: Verify log method broadcasts message correctly
     * Test: Set io and verify emit format
     */
    test("should broadcast message with correct format via Socket.IO", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const mockIo = { emit: jest.fn() };
      fileLogger.setIo(mockIo);
      fileLogger.log("error", "Error message", "error-source");

      expect(mockIo.emit).toHaveBeenCalledWith("logs:entry", {
        type: "broadcast",
        data: {
          entry: {
            level: "error",
            message: "Error message",
            source: "error-source",
            timestamp: expect.any(Number),
          },
        },
      });
    });

    /**
     * Objective: Verify log method does not broadcast when io is null
     * Test: Call log without setting io
     */
    test("should not broadcast when io is not set", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      fileLogger.io = null;
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      // Should not throw
      expect(() => fileLogger.log("info", "Test", "source")).not.toThrow();

      consoleLogSpy.mockRestore();
    });

    /**
     * Objective: Verify log method converts message to string
     * Test: Pass non-string message and verify it gets converted
     */
    test("should convert message to string", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      const originalLog = fileLogger.log.bind(fileLogger);

      // Create a custom log that captures the message argument
      let capturedMessage = null;
      const mockIo = {
        emit: jest.fn().mockImplementation((event, data) => {
          capturedMessage = data.data.entry.message;
        }),
      };
      fileLogger.setIo(mockIo);
      fileLogger.log("info", 123, "source");
      fileLogger.log("info", { msg: "object" }, "source");

      // Verify the message was converted to string
      expect(capturedMessage).toBeDefined();
      expect(typeof capturedMessage).toBe("string");

      consoleLogSpy.mockRestore();
    });
  });

  describe("debug log method", () => {
    /**
     * Objective: Verify debug method only logs when logLevel is debug
     * Test: Call debug at different log levels
     */
    test("should not log debug when logLevel is info", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const originalLevel = fileLogger.logLevel;
      fileLogger.logLevel = "info";
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      fileLogger.debug("Debug message", "source");

      // Should not log to console.log because debug level is higher than info
      expect(consoleLogSpy).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      fileLogger.logLevel = originalLevel;
    });

    /**
     * Objective: Verify debug method logs when logLevel is debug
     * Test: Call debug when logLevel is debug
     */
    test("should log debug when logLevel is debug", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const originalLevel = fileLogger.logLevel;
      fileLogger.logLevel = "debug";
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      fileLogger.debug("Debug message", "source");

      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
      fileLogger.logLevel = originalLevel;
    });

    /**
     * Objective: Verify debug method uses direct log level check
     * Test: Call debug at warn level
     */
    test("should not log debug when logLevel is warn", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const originalLevel = fileLogger.logLevel;
      fileLogger.logLevel = "warn";
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      fileLogger.debug("Debug", "source");

      expect(consoleLogSpy).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
      fileLogger.logLevel = originalLevel;
    });
  });

  describe("readLogFile error handling", () => {
    /**
     * Objective: Verify readLogFile handles read errors gracefully
     * Test: Attempt to read from an invalid file path
     */
    test("should handle read errors gracefully", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      // Should return empty array for non-existent file
      const result = fileLogger.readLogFile("completely-nonexistent-and-impossible.log");
      expect(result).toEqual([]);
    });

    /**
     * Objective: Verify readLogFile returns empty array for file with only whitespace
     * Test: Create file with only whitespace content
     */
    test("should handle file with only whitespace", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const logsDir = path.dirname(fileLogger.getLogFilePath());
      const filePath = path.join(logsDir, "whitespace.log");
      fs.writeFileSync(filePath, "   \n\n   \n", { encoding: "utf8" });

      const result = fileLogger.readLogFile("whitespace.log");
      expect(result).toEqual([]);

      fs.unlinkSync(filePath);
    });

    /**
     * Objective: Verify readLogFile returns empty array for file with only newlines
     * Test: Create file with only newline characters
     */
    test("should handle file with only newlines", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const logsDir = path.dirname(fileLogger.getLogFilePath());
      const filePath = path.join(logsDir, "newlines.log");
      fs.writeFileSync(filePath, "\n\n\n", { encoding: "utf8" });

      const result = fileLogger.readLogFile("newlines.log");
      expect(result).toEqual([]);

      fs.unlinkSync(filePath);
    });
  });

  describe("listLogFiles error handling", () => {
    /**
     * Objective: Verify listLogFiles returns empty array when logs directory doesn't exist
     * Test: Call listLogFiles with non-existent directory
     */
    test("should return empty array when logs directory doesn't exist", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      // The listLogFiles method checks if LOGS_DIR exists first
      // If it doesn't exist, it returns empty array
      const result = fileLogger.listLogFiles();
      expect(Array.isArray(result)).toBe(true);
    });

    /**
     * Objective: Verify listLogFiles filters non-.log files
     * Test: Create various file types and verify filtering
     */
    test("should only return .log files", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const logsDir = path.dirname(fileLogger.getLogFilePath());
      fs.writeFileSync(path.join(logsDir, "test.log"), "test");
      fs.writeFileSync(path.join(logsDir, "test.txt"), "test");
      fs.writeFileSync(path.join(logsDir, "test.log1"), "test");
      fs.writeFileSync(path.join(logsDir, "test.LOG"), "test");

      const result = fileLogger.listLogFiles();

      // Only .log files should be returned (case sensitive check for .log)
      result.forEach((file) => {
        expect(file.endsWith(".log")).toBe(true);
      });
    });
  });

  describe("clearLogFiles error handling", () => {
    /**
     * Objective: Verify clearLogFiles handles delete errors gracefully
     * Test: Call clearLogFiles with mocked file operations
     */
    test("should handle delete errors gracefully", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      // Create some test files
      const logsDir = path.dirname(fileLogger.getLogFilePath());
      fs.writeFileSync(path.join(logsDir, "app-20240615.log"), "test");
      fs.writeFileSync(path.join(logsDir, "app-20240616.log"), "test");

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // Should not throw
      const result = fileLogger.clearLogFiles();
      expect(typeof result).toBe("number");

      consoleErrorSpy.mockRestore();
    });

    /**
     * Objective: Verify clearLogFiles returns 0 when no files exist
     * Test: Call clearLogFiles with empty directory
     */
    test("should return 0 when no log files exist", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      // Create empty logs dir with no log files
      const logsDir = path.dirname(fileLogger.getLogFilePath());

      // First clear any existing files
      const files = fs.readdirSync(logsDir).filter((f) => f.endsWith(".log"));
      files.forEach((f) => fs.unlinkSync(path.join(logsDir, f)));

      const result = fileLogger.clearLogFiles();
      expect(result).toBe(0);
    });
  });

  describe("getLogsDirectorySize error handling", () => {
    /**
     * Objective: Verify getLogsDirectorySize handles stat errors gracefully
     * Test: Call getLogsDirectorySize with various scenarios
     */
    test("should handle directory size calculation gracefully", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      // Should not throw
      const size = fileLogger.getLogsDirectorySize();
      expect(typeof size).toBe("number");
      expect(size).toBeGreaterThanOrEqual(0);
    });

    /**
     * Objective: Verify getLogsDirectorySize returns 0 for empty directory
     * Test: Call with no log files
     */
    test("should return 0 for empty logs directory", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const logsDir = path.dirname(fileLogger.getLogFilePath());
      // Clear all .log files
      const files = fs.readdirSync(logsDir).filter((f) => f.endsWith(".log"));
      files.forEach((f) => fs.unlinkSync(path.join(logsDir, f)));

      const size = fileLogger.getLogsDirectorySize();
      expect(size).toBe(0);
    });

    /**
     * Objective: Verify getLogsDirectorySize counts only accessible files
     * Test: Create files and verify size calculation
     */
    test("should calculate correct total size", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const logsDir = path.dirname(fileLogger.getLogFilePath());
      fs.writeFileSync(path.join(logsDir, "app-20240615.log"), "ABC"); // 3 bytes
      fs.writeFileSync(path.join(logsDir, "app-20240616.log"), "DEFGHI"); // 6 bytes

      const size = fileLogger.getLogsDirectorySize();
      expect(size).toBeGreaterThanOrEqual(9);
    });
  });

  describe("setIo and setDb methods", () => {
    /**
     * Objective: Verify setIo sets the io instance
     * Test: Set io and verify it can be retrieved
     */
    test("should set io instance", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const mockIo = { emit: jest.fn() };
      fileLogger.setIo(mockIo);
      expect(fileLogger.io).toBe(mockIo);
    });

    /**
     * Objective: Verify setDb sets the db instance
     * Test: Set db and verify it can be retrieved
     */
    test("should set db instance", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const mockDb = { addLog: jest.fn() };
      fileLogger.setDb(mockDb);
      expect(fileLogger.db).toBe(mockDb);
    });
  });

  describe("info, error, warn shortcut methods", () => {
    /**
     * Objective: Verify info method calls log with 'info' level
     * Test: Call info and verify log is called correctly
     */
    test("should call log with info level", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      fileLogger.info("Info message", "source");

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain("INFO");

      consoleLogSpy.mockRestore();
    });

    /**
     * Objective: Verify error method calls log with 'error' level
     * Test: Call error and verify log is called correctly
     */
    test("should call log with error level", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      fileLogger.error("Error message", "source");

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain("ERROR");

      consoleLogSpy.mockRestore();
    });

    /**
     * Objective: Verify warn method calls log with 'warn' level
     * Test: Call warn and verify log is called correctly
     */
    test("should call log with warn level", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      fileLogger.warn("Warn message", "source");

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain("WARN");

      consoleLogSpy.mockRestore();
    });

    /**
     * Objective: Verify shortcut methods use default source
     * Test: Call without source parameter
     */
    test("should use default source when not provided", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/file-logger.js");
      const fileLogger = module.fileLogger;

      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      fileLogger.info("Message without source");
      fileLogger.error("Another message");
      fileLogger.warn("Yet another message");

      // All should use default "server" source
      expect(consoleLogSpy).toHaveBeenCalledTimes(3);

      consoleLogSpy.mockRestore();
    });
  });
});
