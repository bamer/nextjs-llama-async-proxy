import { WebSocketTransport } from "@/lib/websocket-transport";
import { createMockIo, createTransport, waitForAsync } from "./websocket-transport.test-utils";

jest.mock("socket.io");

describe("WebSocketTransport Edge Cases", () => {
  let transport: WebSocketTransport;

  beforeEach(() => {
    transport = createTransport();
  });

  describe("Socket.IO emission", () => {
    it("should emit log via Socket.IO when instance is set", (done) => {
      const mockIo = createMockIo();
      transport.setSocketIOInstance(mockIo);

      const callback = jest.fn();
      transport.log({
        level: "info",
        message: "Test message",
        timestamp: "2024-01-01T00:00:00Z",
      }, callback);

      waitForAsync(() => {
        expect(mockIo.emit).toHaveBeenCalledWith("log", {
          type: "log",
          data: expect.objectContaining({
            level: "info",
            message: "Test message",
          }),
          timestamp: expect.any(Number),
        });
        done();
      });
    });

    it("should not emit when Socket.IO instance is not set", (done) => {
      const mockIo = createMockIo();
      const callback = jest.fn();

      transport.log({
        level: "info",
        message: "Test message",
      }, callback);

      waitForAsync(() => {
        expect(mockIo.emit).not.toHaveBeenCalled();
        done();
      });
    });

    it("should handle Socket.IO instance replacement", (done) => {
      const mockIo1 = createMockIo();
      const mockIo2 = createMockIo();
      const callback = jest.fn();

      transport.setSocketIOInstance(mockIo1);
      transport.log({ level: "info", message: "test" }, callback);

      waitForAsync(() => {
        expect(mockIo1.emit).toHaveBeenCalled();

        transport.setSocketIOInstance(mockIo2);
        transport.log({ level: "info", message: "test2" }, callback);

        waitForAsync(() => {
          expect(mockIo2.emit).toHaveBeenCalled();
          done();
        });
      });
    });
  });

  describe("null/undefined handling", () => {
    it("should handle null message", (done) => {
      const callback = jest.fn();
      transport.log({ level: "info", message: null as unknown as string }, callback);

      waitForAsync(() => {
        const logs = transport.getCachedLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].message).toBe("");
        done();
      });
    });

    it("should handle undefined message", (done) => {
      const callback = jest.fn();
      transport.log({ level: "info", message: undefined as unknown as string }, callback);

      waitForAsync(() => {
        const logs = transport.getCachedLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].message).toBe("");
        done();
      });
    });

    it("should handle empty string message", (done) => {
      const callback = jest.fn();
      transport.log({ level: "info", message: "" }, callback);

      waitForAsync(() => {
        const logs = transport.getCachedLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].message).toBe("");
        done();
      });
    });

    it("should handle null level", (done) => {
      const callback = jest.fn();
      transport.log({ level: null as unknown as string, message: "test" }, callback);

      waitForAsync(() => {
        const logs = transport.getCachedLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe("info");
        done();
      });
    });

    it("should handle undefined level", (done) => {
      const callback = jest.fn();
      transport.log({ level: undefined as unknown as string, message: "test" }, callback);

      waitForAsync(() => {
        const logs = transport.getCachedLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe("info");
        done();
      });
    });
  });

  describe("special characters and encoding", () => {
    it("should handle very long message", (done) => {
      const callback = jest.fn();
      const longMessage = "x".repeat(100000);

      transport.log({ level: "info", message: longMessage }, callback);

      waitForAsync(() => {
        const logs = transport.getCachedLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].message).toBe(longMessage);
        done();
      });
    });

    it("should handle message with unicode", (done) => {
      const callback = jest.fn();
      const unicodeMessage = "Hello 世界 🌍 🚀 测试";

      transport.log({ level: "info", message: unicodeMessage }, callback);

      waitForAsync(() => {
        const logs = transport.getCachedLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].message).toBe(unicodeMessage);
        done();
      });
    });

    it("should handle message with special characters", (done) => {
      const callback = jest.fn();
      const specialMessage = "\x00\x01\x02\x03\x1b[31mRed\x1b[0m\n\t\r";

      transport.log({ level: "info", message: specialMessage }, callback);

      waitForAsync(() => {
        const logs = transport.getCachedLogs();
        expect(logs).toHaveLength(1);
        done();
      });
    });
  });

  describe("complex data structures", () => {
    it("should handle deeply nested object message", (done) => {
      const callback = jest.fn();
      const nested = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  value: "deep",
                },
              },
            },
          },
        },
      };

      transport.log({ level: "info", message: nested }, callback);

      waitForAsync(() => {
        const logs = transport.getCachedLogs();
        expect(logs).toHaveLength(1);
        done();
      });
    });

    it("should handle array message", (done) => {
      const callback = jest.fn();
      const arrayMessage = [1, 2, 3, { nested: "value" }, ["array", "in", "array"]];

      transport.log({ level: "info", message: arrayMessage }, callback);

      waitForAsync(() => {
        const logs = transport.getCachedLogs();
        expect(logs).toHaveLength(1);
        done();
      });
    });
  });

  describe("queue rotation and limits", () => {
    it("should handle rapid successive logs", (done) => {
      const callback = jest.fn();

      for (let i = 0; i < 1000; i++) {
        transport.log({ level: "info", message: `Log ${i}` }, callback);
      }

      waitForAsync(() => {
        const logs = transport.getCachedLogs();
        expect(logs.length).toBe(500);
        expect(callback).toHaveBeenCalledTimes(1000);
        done();
      });
    });

    it("should handle queue rotation correctly", (done) => {
      const callback = jest.fn();

      // Add exactly 500 logs
      for (let i = 0; i < 500; i++) {
        transport.log({ level: "info", message: `Log ${i}` }, callback);
      }

      waitForAsync(() => {
        const logs = transport.getCachedLogs();
        expect(logs).toHaveLength(500);
        expect(logs[0].message).toBe("Log 499");
        expect(logs[499].message).toBe("Log 0");

        // Add one more, should remove oldest
        transport.log({ level: "info", message: "Log 500" }, callback);

        waitForAsync(() => {
          const updatedLogs = transport.getCachedLogs();
          expect(updatedLogs).toHaveLength(500);
          expect(updatedLogs[0].message).toBe("Log 500");
          expect(updatedLogs[499].message).toBe("Log 1");
          done();
        });
      });
    });
  });

  describe("integration scenarios", () => {
    it("should handle log lifecycle", (done) => {
      const callback = jest.fn();

      transport.log({ level: "info", message: "First log" }, callback);
      transport.log({ level: "error", message: "Error log" }, callback);
      transport.log({ level: "warn", message: "Warning log" }, callback);

      waitForAsync(() => {
        expect(transport.getCachedLogs()).toHaveLength(3);
        expect(transport.getLogsByLevel("info")).toHaveLength(1);
        expect(transport.getLogsByLevel("error")).toHaveLength(1);
        expect(transport.getLogsByLevel("warn")).toHaveLength(1);

        transport.clearQueue();
        expect(transport.getCachedLogs()).toHaveLength(0);
        done();
      });
    });

    it("should handle all possible log levels", (done) => {
      const callback = jest.fn();
      const levels = ["error", "warn", "info", "debug", "verbose", "silly"] as const;

      levels.forEach((level) => {
        transport.log({ level, message: "test" }, callback);
      });

      waitForAsync(() => {
        const logs = transport.getCachedLogs();
        expect(logs).toHaveLength(levels.length);
        logs.forEach((log) => {
          expect(levels).toContain(log.level as (typeof levels)[number]);
        });
        done();
      });
    });
  });
});
