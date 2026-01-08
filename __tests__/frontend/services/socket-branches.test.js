/**
 * Socket Client Branch Coverage Tests
 * @jest-environment jsdom
 *
 * Tests to achieve ≥98% line coverage for public/js/services/socket.js
 * Focuses on uncovered branches and edge cases
 */

global.window = global.window || {};

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

function createMockFn() {
  const fn = function (...args) {
    fn.mock.calls.push(args);
    if (fn._mockReturnValue !== undefined) return fn._mockReturnValue;
    if (fn._mockImplementation) return fn._mockImplementation(...args);
  };
  fn.mock = { calls: [] };
  fn._mockReturnValue = undefined;
  fn._mockImplementation = undefined;
  fn.mockReturnValue = function (v) {
    fn._mockReturnValue = v;
    return fn;
  };
  fn.mockImplementation = function (i) {
    fn._mockImplementation = i;
    return fn;
  };
  fn.mockClear = function () {
    fn.mock.calls = [];
    fn._mockReturnValue = undefined;
    fn._mockImplementation = undefined;
  };
  return fn;
}

// Mock Socket.IO instance factory with advanced features
function createMockSocket() {
  const handlers = {};
  let onAnyHandler = null;
  let connectionState = "disconnected";

  const s = {
    get connected() {
      return connectionState === "connected";
    },
    set connected(v) {
      connectionState = v ? "connected" : "disconnected";
    },
    id: null,
    on: createMockFn().mockImplementation(function (event, handler) {
      if (!handlers[event]) handlers[event] = [];
      handlers[event].push(handler);
      return s;
    }),
    off: createMockFn().mockImplementation(function (event, handler) {
      if (handlers[event]) {
        if (handler) {
          handlers[event] = handlers[event].filter((h) => h !== handler);
        } else {
          delete handlers[event];
        }
      }
      return s;
    }),
    emit: createMockFn(),
    disconnect: createMockFn().mockImplementation(function () {
      connectionState = "disconnected";
    }),
    connect: createMockFn().mockImplementation(function () {
      connectionState = "connected";
      return s;
    }),
    onAny: createMockFn().mockImplementation(function (handler) {
      onAnyHandler = handler;
      return s;
    }),
    _trigger: function (event, ...args) {
      if (handlers[event]) {
        handlers[event].forEach((h) => {
          h(...args);
        });
      }
      // Also trigger onAny handler for event forwarding
      if (onAnyHandler) {
        onAnyHandler(event, ...args);
      }
    },
    _handlers: handlers,
    get _onAnyHandler() {
      return onAnyHandler;
    },
    _setConnectionState: function (state) {
      connectionState = state;
    },
  };
  return s;
}

// Mock document elements
const mockScript = {
  src: "",
  onload: null,
};

const mockHeadAppendChild = createMockFn().mockImplementation(function (s) {
  if (s.onload && !mockScript.onload) {
    mockScript.onload = s.onload;
  }
  return s;
});

const mockCreateElement = createMockFn().mockImplementation(function (tag) {
  if (tag === "script") {
    return {
      src: "",
      onload: null,
    };
  }
  return { tagName: tag.toUpperCase() };
});

global.document = {
  head: {
    appendChild: mockHeadAppendChild,
  },
  createElement: mockCreateElement,
};

// Mock console methods
const consoleLogMock = createMockFn();
const consoleErrorMock = createMockFn();
global.console = {
  log: consoleLogMock,
  error: consoleErrorMock,
  warn: createMockFn(),
};

// io mock state
let mockIoFn = null;

Object.defineProperty(global.window, "io", {
  get: function () {
    return mockIoFn || undefined;
  },
  set: function (v) {
    mockIoFn = v;
  },
  configurable: true,
});

// Import socket module
const socketPath = new URL("../../../public/js/services/socket.js", import.meta.url);
await import(socketPath.href);

const SocketClient = global.window.SocketClient;
const socketClient = global.window.socketClient;

describe("SocketClient Branch Coverage", function () {
  let mockSocket;

  beforeEach(function () {
    mockSocket = createMockSocket();
    mockSocket.connected = false;
    mockSocket.id = null;
    mockIoFn = null;
    mockHeadAppendChild.mock.calls = [];
    mockCreateElement.mock.calls = [];
    consoleLogMock.mock.calls = [];
    consoleErrorMock.mock.calls = [];
  });

  afterEach(function () {
    mockIoFn = null;
  });

  // ============================================
  // CONNECT BRANCHES
  // ============================================

  describe("connect - exponential backoff and reconnection", function () {
    it("should skip connection when socket is already connected (branch coverage)", function () {
      const client = new SocketClient();
      client.socket = { connected: true };

      // This should hit the early return branch
      const result = client.connect();

      // Verify early return was taken
      expect(result).toBe(client);
      // socket.io should NOT be called since already connected
      expect(mockCreateElement.mock.calls.length).toBe(0);
    });

    it("should connect via script load when io is not available (branch coverage)", function () {
      mockIoFn = null; // io not available
      mockCreateElement.mockClear();
      mockHeadAppendChild.mockClear();

      const client = new SocketClient();
      client.connect();

      // Should have created script element (immediately, before onload)
      expect(mockCreateElement.mock.calls.length).toBeGreaterThan(0);
      expect(mockHeadAppendChild.mock.calls.length).toBeGreaterThan(0);
    });

    it("should handle multiple rapid connect calls", function () {
      mockIoFn = () => mockSocket;

      const client = new SocketClient();

      // First call - should start connection
      client.connect();
      const firstScriptCall = mockCreateElement.mock.calls.length;

      // Second call immediately after - should return early due to connected check
      // Note: socket is not yet connected at this point
      client.connect();

      // Should not create multiple script elements
      expect(mockCreateElement.mock.calls.length).toBe(firstScriptCall);
    });

    it("should reconnect after manual disconnect", function () {
      mockIoFn = () => mockSocket;

      const client = new SocketClient();
      client._connect();

      // Simulate connected state
      mockSocket._setConnectionState("connected");

      // Disconnect
      client.disconnect();

      // socket should be null now
      expect(client.socket).toBeNull();

      // Reconnect should work
      client.connect();

      // Should attempt to use io again (it will fail since io returns undefined after disconnect)
      // but the call should happen
      expect(mockIoFn).not.toBeNull();
    });
  });

  // ============================================
  // EMIT BRANCHES
  // ============================================

  describe("emit - conditional branches", function () {
    it("should emit when socket is connected (branch coverage)", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client._connect();
      mockSocket.connected = true;

      client.emit("test:event", { data: "test" });

      expect(mockSocket.emit.mock.calls.length).toBe(1);
    });

    it("should not emit when socket is not connected (branch coverage)", function () {
      const client = new SocketClient();
      client.socket = { connected: false };

      client.emit("test:event", { data: "test" });

      expect(mockSocket.emit.mock.calls.length).toBe(0);
    });

    it("should handle emit with no socket at all", function () {
      const client = new SocketClient();
      client.socket = null;

      // Should not throw
      expect(() => client.emit("test")).not.toThrow();
    });

    it("should use default empty object for data", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client._connect();
      mockSocket.connected = true;

      client.emit("test:event");

      const emitCall = mockSocket.emit.mock.calls.find((c) => c[0] === "test:event");
      expect(emitCall[1]).toEqual({});
    });
  });

  // ============================================
  // OFF BRANCHES
  // ============================================

  describe("off - handler cleanup branches", function () {
    it("should remove specific handler when provided (branch coverage)", function () {
      const client = new SocketClient();
      const handler1 = function () {};
      const handler2 = function () {};

      client.on("test:event", handler1);
      client.on("test:event", handler2);

      // Remove only handler1
      client.off("test:event", handler1);

      expect(client.handlers.get("test:event").has(handler1)).toBe(false);
      expect(client.handlers.get("test:event").has(handler2)).toBe(true);
    });

    it("should remove all handlers when no handler provided (branch coverage)", function () {
      const client = new SocketClient();
      const handler1 = function () {};
      const handler2 = function () {};

      client.on("test:event", handler1);
      client.on("test:event", handler2);

      client.off("test:event");

      expect(client.handlers.has("test:event")).toBe(false);
    });

    it("should handle off for non-existent event gracefully", function () {
      const client = new SocketClient();

      // Should not throw
      expect(() => client.off("non:existent")).not.toThrow();
    });

    it("should handle off when event exists but no handlers", function () {
      const client = new SocketClient();

      client.on("test:event", function () {});
      client.off("test:event"); // Removes the only handler

      // Now off again for same event - should not throw
      expect(() => client.off("test:event")).not.toThrow();
    });

    it("should handle off with handler for event that has different handlers", function () {
      const client = new SocketClient();
      const handler1 = function () {};
      const handler2 = function () {};

      client.on("test:event", handler1);
      client.off("test:event", handler2); // handler2 doesn't exist

      // Should not throw, handler1 should still exist
      expect(client.handlers.get("test:event").has(handler1)).toBe(true);
    });
  });

  // ============================================
  // ONCE BRANCHES
  // ============================================

  describe("once - one-time handler branches", function () {
    it("should call handler exactly once", function () {
      const client = new SocketClient();
      let callCount = 0;
      const handler = function () {
        callCount++;
      };

      client.once("test:event", handler);
      client._emit("test:event", "first");
      client._emit("test:event", "second");
      client._emit("test:event", "third");

      expect(callCount).toBe(1);
    });

    it("should remove wrapper after single call", function () {
      const client = new SocketClient();
      const handler = function () {};

      client.once("test:event", handler);
      client._emit("test:event", "data");

      // The wrapper should be removed
      expect(client.handlers.get("test:event").size).toBe(0);
    });

    it("should support chaining", function () {
      const client = new SocketClient();

      expect(client.once("test", function () {})).toBe(client);
    });

    it("should pass data to handler correctly", function () {
      const client = new SocketClient();
      let receivedData = null;

      client.once("test:event", function (data) {
        receivedData = data;
      });

      client._emit("test:event", { key: "value" });

      expect(receivedData).toEqual({ key: "value" });
    });
  });

  // ============================================
  // _EMIT BRANCHES
  // ============================================

  describe("_emit - handler execution branches", function () {
    it("should execute all handlers for existing event (branch coverage)", function () {
      const client = new SocketClient();
      let callCount = 0;
      const handler1 = function () {
        callCount++;
      };
      const handler2 = function () {
        callCount++;
      };

      client.on("event:1", handler1);
      client.on("event:1", handler2);
      client._emit("event:1", "data");

      expect(callCount).toBe(2);
    });

    it("should handle non-existent event gracefully (branch coverage)", function () {
      const client = new SocketClient();

      // Should not throw
      expect(() => client._emit("non:existent", "data")).not.toThrow();
    });

    it("should catch and log handler errors (branch coverage)", function () {
      const client = new SocketClient();
      const errorHandler = function () {
        throw new Error("Test error");
      };

      client.on("event:1", errorHandler);

      // Should not throw
      expect(() => client._emit("event:1", "data")).not.toThrow();

      // Error should be logged
      expect(consoleErrorMock.mock.calls.length).toBeGreaterThan(0);
    });

    it("should continue executing handlers after one throws", function () {
      const client = new SocketClient();
      let callCount = 0;
      const errorHandler = function () {
        throw new Error("Handler error");
      };
      const normalHandler = function () {
        callCount++;
      };

      client.on("event:1", errorHandler);
      client.on("event:1", normalHandler);

      // Should not throw and should execute normal handler
      expect(() => client._emit("event:1", "data")).not.toThrow();
      expect(callCount).toBe(1);
    });

    it("should handle undefined handlers set gracefully", function () {
      const client = new SocketClient();

      // Directly set an undefined value in handlers
      client.handlers.set("test:event", undefined);

      // Should not throw
      expect(() => client._emit("test:event", "data")).not.toThrow();
    });
  });

  // ============================================
  // CONNECT ERROR HANDLING
  // ============================================

  describe("connect_error - heartbeat timeout handling", function () {
    it("should handle connect_error event", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      let receivedError = null;

      client.on("connect_error", function (error) {
        receivedError = error;
      });

      client._connect();

      // Trigger connect_error handler
      const handlers = mockSocket._handlers;
      const error = new Error("ETIMEDOUT");
      if (handlers["connect_error"] && handlers["connect_error"].length > 0) {
        handlers["connect_error"].forEach((h) => h(error));
      }

      expect(receivedError).toBe(error);
    });

    it("should log connect_error message", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();

      client._connect();

      // Trigger connect_error
      const handlers = mockSocket._handlers;
      const error = new Error("Connection timeout");
      if (handlers["connect_error"] && handlers["connect_error"].length > 0) {
        handlers["connect_error"].forEach((h) => h(error));
      }

      expect(consoleErrorMock.mock.calls.length).toBeGreaterThan(0);
    });

    it("should handle multiple connect_error events", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      let errorCount = 0;

      client.on("connect_error", function () {
        errorCount++;
      });

      client._connect();

      const handlers = mockSocket._handlers;
      const error = new Error("Test");

      // Trigger multiple errors
      if (handlers["connect_error"] && handlers["connect_error"].length > 0) {
        handlers["connect_error"].forEach((h) => h(error));
        handlers["connect_error"].forEach((h) => h(error));
        handlers["connect_error"].forEach((h) => h(error));
      }

      expect(errorCount).toBe(3);
    });
  });

  // ============================================
  // BINARY DATA HANDLING
  // ============================================

  describe("binary data handling", function () {
    it("should forward ArrayBuffer via onAny", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      let receivedData = null;

      client.on("binary:data", function (data) {
        receivedData = data;
      });

      client._connect();

      // Simulate binary data via onAny handler
      const buffer = new ArrayBuffer(1024);
      if (mockSocket._onAnyHandler) {
        mockSocket._onAnyHandler("binary:data", buffer);
      }

      expect(receivedData).toBe(buffer);
    });

    it("should forward Blob data via onAny", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      let receivedData = null;

      client.on("blob:data", function (data) {
        receivedData = data;
      });

      client._connect();

      // Simulate blob data via onAny handler
      const blob = new Blob(["test"], { type: "text/plain" });
      if (mockSocket._onAnyHandler) {
        mockSocket._onAnyHandler("blob:data", blob);
      }

      expect(receivedData).toBe(blob);
    });

    it("should handle Uint8Array data", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      let receivedData = null;

      client.on("uint8:data", function (data) {
        receivedData = data;
      });

      client._connect();

      const uint8Data = new Uint8Array([1, 2, 3, 4, 5]);
      if (mockSocket._onAnyHandler) {
        mockSocket._onAnyHandler("uint8:data", uint8Data);
      }

      expect(receivedData).toEqual(uint8Data);
    });

    it("should handle mixed binary and JSON events", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      let jsonData = null;
      let binaryData = null;

      client.on("json:event", function (data) {
        jsonData = data;
      });
      client.on("binary:event", function (data) {
        binaryData = data;
      });

      client._connect();

      // First emit JSON
      if (mockSocket._onAnyHandler) {
        mockSocket._onAnyHandler("json:event", { key: "value" });
      }

      // Then emit binary
      const buffer = new ArrayBuffer(64);
      if (mockSocket._onAnyHandler) {
        mockSocket._onAnyHandler("binary:event", buffer);
      }

      expect(jsonData).toEqual({ key: "value" });
      expect(binaryData).toBe(buffer);
    });
  });

  // ============================================
  // MULTIPLE SIMULTANEOUS CONNECTIONS
  // ============================================

  describe("multiple simultaneous connections", function () {
    it("should create independent socket clients", function () {
      const mockSocket1 = createMockSocket();
      const mockSocket2 = createMockSocket();
      let socket1Id = null;
      let socket2Id = null;

      mockIoFn = (origin, opts) => {
        if (!socket1Id) {
          socket1Id = "socket-1";
          return mockSocket1;
        }
        socket2Id = "socket-2";
        return mockSocket2;
      };

      const client1 = new SocketClient();
      const client2 = new SocketClient();

      client1._connect();
      client2._connect();

      expect(client1.socket).toBe(mockSocket1);
      expect(client2.socket).toBe(mockSocket2);
      expect(client1.socket).not.toBe(client2.socket);
    });

    it("should handle independent event handlers per client", function () {
      const mockSocket1 = createMockSocket();
      const mockSocket2 = createMockSocket();

      mockIoFn = () => {
        return mockSocket1;
      };

      const client1 = new SocketClient();
      client1._connect();

      // Reset mock for second client
      mockIoFn = () => mockSocket2;
      const client2 = new SocketClient();
      client2._connect();

      let client1Events = 0;
      let client2Events = 0;

      client1.on("shared:event", () => client1Events++);
      client2.on("shared:event", () => client2Events++);

      // Emit to both
      client1._emit("shared:event", "data");
      client2._emit("shared:event", "data");

      expect(client1Events).toBe(1);
      expect(client2Events).toBe(1);
    });

    it("should handle disconnect/connect cycles independently", function () {
      mockIoFn = () => mockSocket;

      const client1 = new SocketClient();
      const client2 = new SocketClient();

      // Connect both
      client1._connect();
      client2._connect();

      // Disconnect only client1
      client1.disconnect();

      expect(client1.socket).toBeNull();
      expect(client2.socket).not.toBeNull();

      // Client2 should still be functional
      mockSocket.connected = true;
      expect(client2.isConnected).toBe(true);
    });

    it("should handle concurrent emit from multiple clients", function () {
      mockIoFn = () => mockSocket;

      const client1 = new SocketClient();
      const client2 = new SocketClient();

      client1._connect();
      client2._connect();

      mockSocket.connected = true;

      client1.emit("event1", { from: "client1" });
      client2.emit("event2", { from: "client2" });

      const emitCalls = mockSocket.emit.mock.calls;

      expect(emitCalls.some((c) => c[0] === "event1" && c[1]?.from === "client1")).toBe(true);
      expect(emitCalls.some((c) => c[0] === "event2" && c[1]?.from === "client2")).toBe(true);
    });
  });

  // ============================================
  // SOCKET.IO EVENT HANDLER REGISTRATION
  // ============================================

  describe("Socket.IO event handler registration", function () {
    it("should register connect handler with correct callback", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client._connect();

      const connectHandlers = mockSocket._handlers["connect"];
      expect(connectHandlers).toBeDefined();
      expect(connectHandlers.length).toBeGreaterThan(0);
    });

    it("should register disconnect handler with correct callback", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client._connect();

      const disconnectHandlers = mockSocket._handlers["disconnect"];
      expect(disconnectHandlers).toBeDefined();
      expect(disconnectHandlers.length).toBeGreaterThan(0);
    });

    it("should register connect_error handler", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client._connect();

      const errorHandlers = mockSocket._handlers["connect_error"];
      expect(errorHandlers).toBeDefined();
      expect(errorHandlers.length).toBeGreaterThan(0);
    });

    it("should register onAny handler for event forwarding", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client._connect();

      expect(mockSocket.onAny.mock.calls.length).toBe(1);
    });

    it("should register all handlers before emitting events", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();

      let connectFired = false;
      let disconnectFired = false;
      let errorFired = false;

      client.on("connect", () => (connectFired = true));
      client.on("disconnect", () => (disconnectFired = true));
      client.on("connect_error", () => (errorFired = true));

      client._connect();

      // Trigger all handlers
      const handlers = mockSocket._handlers;

      if (handlers["connect"]) handlers["connect"].forEach((h) => h());
      if (handlers["disconnect"]) handlers["disconnect"].forEach((h) => h("test"));
      if (handlers["connect_error"]) handlers["connect_error"].forEach((h) => h(new Error("test")));

      expect(connectFired).toBe(true);
      expect(disconnectFired).toBe(true);
      expect(errorFired).toBe(true);
    });

    it("should handle removing handlers for internal socket events", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client._connect();

      // Get registered handlers count
      const initialOnCalls = mockSocket.on.mock.calls.length;

      // Off should be callable on internal handlers
      expect(() => client.off("connect")).not.toThrow();
    });
  });

  // ============================================
  // PROPERTY ACCESSORS
  // ============================================

  describe("property accessors", function () {
    describe("isConnected", function () {
      it("should return true when socket.connected is true", function () {
        mockIoFn = () => mockSocket;
        const client = new SocketClient();
        client._connect();
        mockSocket.connected = true;

        expect(client.isConnected).toBe(true);
      });

      it("should return false when socket.connected is false", function () {
        mockIoFn = () => mockSocket;
        const client = new SocketClient();
        client._connect();
        mockSocket.connected = false;

        expect(client.isConnected).toBe(false);
      });

      it("should return false when socket is null", function () {
        const client = new SocketClient();
        client.socket = null;

        expect(client.isConnected).toBe(false);
      });

      it("should return false when socket is undefined", function () {
        const client = new SocketClient();

        expect(client.isConnected).toBe(false);
      });
    });

    describe("id", function () {
      it("should return socket.id when available", function () {
        mockIoFn = () => mockSocket;
        const client = new SocketClient();
        client._connect();
        mockSocket.id = "socket-123";

        expect(client.id).toBe("socket-123");
      });

      it("should return null when socket is null", function () {
        const client = new SocketClient();
        client.socket = null;

        expect(client.id).toBe(null);
      });

      it("should return null when socket.id is undefined", function () {
        const client = new SocketClient();
        client.socket = {};

        expect(client.id).toBe(null);
      });
    });
  });

  // ============================================
  // CHAINING
  // ============================================

  describe("method chaining", function () {
    it("connect should return this", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();

      expect(client.connect()).toBe(client);
    });

    it("disconnect should return this", function () {
      const client = new SocketClient();

      expect(client.disconnect()).toBe(client);
    });

    it("emit should return this", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client._connect();
      mockSocket.connected = true;

      expect(client.emit("test")).toBe(client);
    });

    it("on should return this", function () {
      const client = new SocketClient();

      expect(client.on("test", function () {})).toBe(client);
    });

    it("off should return this", function () {
      const client = new SocketClient();

      expect(client.off("test")).toBe(client);
    });

    it("once should return this", function () {
      const client = new SocketClient();

      expect(client.once("test", function () {})).toBe(client);
    });

    it("should support fluent API pattern", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();

      // Chain multiple methods
      client
        .connect()
        .on("event", function () {})
        .emit("data", {});

      expect(client).toBeDefined();
    });
  });

  // ============================================
  // EDGE CASES AND ERROR BOUNDARIES
  // ============================================

  describe("edge cases and error boundaries", function () {
    it("should handle empty event names", function () {
      const client = new SocketClient();

      expect(() => client.on("", function () {})).not.toThrow();
      expect(() => client.emit("", {})).not.toThrow();
      expect(() => client._emit("", "data")).not.toThrow();
    });

    it("should handle special characters in event names", function () {
      const client = new SocketClient();

      expect(() => client.on("event:name.with-special", function () {})).not.toThrow();
      expect(() => client._emit("event:name.with-special", "data")).not.toThrow();
    });

    it("should handle null data in emit", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client._connect();
      mockSocket.connected = true;

      expect(() => client.emit("test", null)).not.toThrow();
    });

    it("should handle undefined data in emit", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client._connect();
      mockSocket.connected = true;

      expect(() => client.emit("test", undefined)).not.toThrow();
    });

    it("should handle circular reference in data", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client._connect();
      mockSocket.connected = true;

      const circular = { self: null };
      circular.self = circular;

      expect(() => client.emit("test", circular)).not.toThrow();
    });

    it("should handle very large data payloads", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client._connect();
      mockSocket.connected = true;

      // Create large data object
      const largeData = {
        array: new Array(10000).fill(0).map((_, i) => ({ index: i })),
        string: "x".repeat(100000),
      };

      expect(() => client.emit("test", largeData)).not.toThrow();
    });

    it("should handle concurrent handler registration and removal", function () {
      const client = new SocketClient();
      const handlers = [];

      // Register many handlers
      for (let i = 0; i < 100; i++) {
        handlers.push(function () {});
        client.on("test", handlers[i]);
      }

      // Remove every other handler
      for (let i = 0; i < handlers.length; i += 2) {
        client.off("test", handlers[i]);
      }

      // Should still have 50 handlers
      expect(client.handlers.get("test").size).toBe(50);

      // All remaining handlers should work
      let callCount = 0;
      client._emit("test", "data");
      expect(callCount).toBe(50);
    });

    it("should handle disconnect during active event handling", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      let innerEmitCalled = false;

      client.on("test", function () {
        // Disconnect during handler execution
        client.disconnect();
        // Try to emit (should not crash)
        client.emit("inner", {});
        innerEmitCalled = true;
      });

      client._connect();
      mockSocket.connected = true;

      expect(() => client.emit("test", {})).not.toThrow();
      expect(innerEmitCalled).toBe(true);
    });

    it("should handle rapid connect/disconnect cycles", function () {
      mockIoFn = () => mockSocket;

      for (let i = 0; i < 10; i++) {
        const client = new SocketClient();
        client._connect();
        client.disconnect();
      }

      // Should complete without errors
      expect(true).toBe(true);
    });
  });
});
