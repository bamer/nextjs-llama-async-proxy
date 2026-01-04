import { WebSocketTransport } from "@/lib/websocket-transport";
import { createMockIo, createTransport, mockLogInfo, waitForAsync } from "./websocket-transport.test-utils";

jest.mock("socket.io");

describe("WebSocketTransport Queue Management", () => {
  let transport: WebSocketTransport;

  beforeEach(() => {
    transport = createTransport();
  });

  describe("getCachedLogs", () => {
    beforeEach((done) => {
      const callback = jest.fn();
      transport.log({ level: "info", message: "Message 1" }, callback);
      transport.log({ level: "error", message: "Message 2" }, callback);
      waitForAsync(done);
    });

    it("should return cached logs", () => {
      const cachedLogs = transport.getCachedLogs();

      expect(cachedLogs).toHaveLength(2);
      expect(cachedLogs[0].message).toBe("Message 2");
      expect(cachedLogs[1].message).toBe("Message 1");
    });

    it("should return a copy of logs", () => {
      const logs1 = transport.getCachedLogs();
      const logs2 = transport.getCachedLogs();

      expect(logs1).not.toBe(logs2);
      expect(logs1).toEqual(logs2);
    });
  });

  describe("getLogsByLevel", () => {
    beforeEach((done) => {
      transport.log({ level: "info", message: "Info 1" }, jest.fn());
      transport.log({ level: "error", message: "Error 1" }, jest.fn());
      transport.log({ level: "info", message: "Info 2" }, jest.fn());
      transport.log({ level: "warn", message: "Warn 1" }, jest.fn());
      waitForAsync(done);
    });

    it("should return logs for specific level", () => {
      const infoLogs = transport.getLogsByLevel("info");

      expect(infoLogs).toHaveLength(2);
      expect(infoLogs.every((log) => log.level === "info")).toBe(true);
    });

    it("should return empty array for non-existent level", () => {
      const debugLogs = transport.getLogsByLevel("debug");

      expect(debugLogs).toEqual([]);
    });

    it("should handle case-sensitive level matching", () => {
      const infoLogs = transport.getLogsByLevel("INFO");

      expect(infoLogs).toHaveLength(0);
    });

    it("should handle getLogsByLevel with empty queue", () => {
      const newTransport = createTransport();
      const logs = newTransport.getLogsByLevel("info");
      expect(logs).toEqual([]);
    });

    it("should handle getLogsByLevel with non-existent level", (done) => {
      transport.log({ level: "info", message: "test" }, jest.fn());

      waitForAsync(() => {
        const logs = transport.getLogsByLevel("nonexistent");
        expect(logs).toEqual([]);
        done();
      });
    });
  });

  describe("log queue operations", () => {
    it("should add log entry to queue", (done) => {
      const callback = jest.fn();
      transport.log(mockLogInfo, callback);

      waitForAsync(() => {
        const cachedLogs = transport.getCachedLogs();
        expect(cachedLogs).toHaveLength(1);
        expect(cachedLogs[0].message).toBe("Test message");
        done();
      });
    });

    it("should generate unique log ID", (done) => {
      const callback = jest.fn();
      transport.log(mockLogInfo, callback);
      transport.log(mockLogInfo, callback);

      waitForAsync(() => {
        const cachedLogs = transport.getCachedLogs();
        expect(cachedLogs[0].id).not.toBe(cachedLogs[1].id);
        done();
      });
    });

    it("should set default timestamp if not provided", (done) => {
      const callback = jest.fn();
      transport.log({ level: "info", message: "Message 1" }, callback);

      waitForAsync(() => {
        const cachedLogs = transport.getCachedLogs();
        expect(cachedLogs[0].timestamp).toBeDefined();
        expect(new Date(cachedLogs[0].timestamp)).not.toEqual("Invalid Date");
        done();
      });
    });

    it("should set default level if not provided", (done) => {
      const callback = jest.fn();
      transport.log({ message: "Test message" }, callback);

      waitForAsync(() => {
        const cachedLogs = transport.getCachedLogs();
        expect(cachedLogs[0].level).toBe("info");
        done();
      });
    });

    it("should convert object message to string", (done) => {
      const callback = jest.fn();
      transport.log({
        level: "info",
        message: { key: "value", nested: { data: 123 } },
      }, callback);

      waitForAsync(() => {
        const cachedLogs = transport.getCachedLogs();
        expect(typeof cachedLogs[0].message).toBe("string");
        expect(cachedLogs[0].message).toContain("key");
        done();
      });
    });

    it("should add source context", (done) => {
      const callback = jest.fn();
      transport.log({ level: "info", message: "Test message" }, callback);

      waitForAsync(() => {
        const cachedLogs = transport.getCachedLogs();
        expect(cachedLogs[0].context).toEqual({
          source: "application",
        });
        done();
      });
    });

    it("should limit queue size to 500", (done) => {
      const callback = jest.fn();
      const info = { level: "info", message: "Test" };

      for (let i = 0; i < 600; i++) {
        transport.log({ ...info, message: `Test ${i}` }, callback);
      }

      waitForAsync(() => {
        const cachedLogs = transport.getCachedLogs();
        expect(cachedLogs.length).toBeLessThanOrEqual(500);
        done();
      });
    });
  });
});
