import { WebSocketTransport } from "@/lib/websocket-transport";
import { createMockIo, createTransport, mockLogInfo, waitForAsync } from "./websocket-transport.test-utils";

jest.mock("socket.io");

describe("WebSocketTransport Constructor", () => {
  it("should create transport without io instance", () => {
    const newTransport = new WebSocketTransport();

    expect(newTransport).toBeInstanceOf(require("winston").Transport);
  });

  it("should create transport with io instance", () => {
    const mockIo = createMockIo();
    const newTransport = new WebSocketTransport({ io: mockIo });

    expect(newTransport).toBeInstanceOf(require("winston").Transport);
  });
});

describe("WebSocketTransport SetSocketIOInstance", () => {
  let transport: WebSocketTransport;

  beforeEach(() => {
    transport = createTransport();
  });

  it("should set Socket.IO instance", () => {
    const mockIo = createMockIo();
    transport.setSocketIOInstance(mockIo);

    expect(transport["io"]).toBe(mockIo);
  });

  it("should replace existing instance", () => {
    const mockIo1 = createMockIo();
    const mockIo2 = createMockIo();
    transport.setSocketIOInstance(mockIo1);
    transport.setSocketIOInstance(mockIo2);

    expect(transport["io"]).toBe(mockIo2);
  });
});

describe("WebSocketTransport Log Callback", () => {
  let transport: WebSocketTransport;

  beforeEach(() => {
    transport = createTransport();
  });

  it("should call callback", (done) => {
    const callback = jest.fn();
    transport.log(mockLogInfo, callback);

    waitForAsync(() => {
      expect(callback).toHaveBeenCalled();
      done();
    });
  });

  it("should work without callback", (done) => {
    transport.log(mockLogInfo);

    waitForAsync(() => {
      const cachedLogs = transport.getCachedLogs();
      expect(cachedLogs).toHaveLength(1);
      done();
    });
  });

  it("should handle callback as null", (done) => {
    transport.log(mockLogInfo, null as unknown as jest.Mock);

    waitForAsync(() => {
      const cachedLogs = transport.getCachedLogs();
      expect(cachedLogs).toHaveLength(1);
      done();
    });
  });
});

describe("WebSocketTransport ClearQueue", () => {
  let transport: WebSocketTransport;

  beforeEach((done) => {
    transport = createTransport();
    transport.log({ level: "info", message: "Message 1" }, jest.fn());
    transport.log({ level: "error", message: "Message 2" }, jest.fn());
    waitForAsync(done);
  });

  it("should clear all logs from queue", () => {
    expect(transport.getCachedLogs()).toHaveLength(2);

    transport.clearQueue();

    expect(transport.getCachedLogs()).toHaveLength(0);
  });

  it("should handle clearQueue on empty queue", () => {
    const newTransport = createTransport();
    expect(() => newTransport.clearQueue()).not.toThrow();
    expect(newTransport.getCachedLogs()).toHaveLength(0);
  });

  it("should handle clearQueue multiple times", (done) => {
    transport.log({ level: "info", message: "test" }, jest.fn());

    waitForAsync(() => {
      transport.clearQueue();
      transport.clearQueue();
      transport.clearQueue();
      expect(transport.getCachedLogs()).toHaveLength(0);
      done();
    });
  });
});
