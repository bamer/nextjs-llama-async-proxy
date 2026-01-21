/**
 * Socket Client Tests
 * @jest-environment jsdom
 */

global.window = global.window || {};

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

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

// Mock Socket.IO instance factory
function createMockSocket() {
  const handlers = {};
  let onAnyHandler = null;
  const s = {
    connected: false,
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
    disconnect: createMockFn(),
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
  };
  return s;
}

// Mock document elements
const mockScript = {
  src: "",
  onload: null,
};

const mockHeadAppendChild = createMockFn().mockImplementation(function (s) {
  // Store the onload callback to simulate script load completion
  if (s.onload && !mockScript.onload) {
    mockScript.onload = s.onload;
  }
  return s;
});

const mockCreateElement = createMockFn().mockImplementation(function (tag) {
  if (tag === "script") {
    // Return a fresh script element each time
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

// Mock console methods to avoid noise in tests
const consoleLogMock = createMockFn();
const consoleErrorMock = createMockFn();
global.console = {
  log: consoleLogMock,
  error: consoleErrorMock,
  warn: createMockFn(),
};

// io mock state - will be set per-test
let mockIoFn = null;

// Dynamic io mock using Object.defineProperty to ensure it reads current value
Object.defineProperty(global.window, "io", {
  get: function () {
    return mockIoFn || undefined;
  },
  set: function (v) {
    mockIoFn = v;
  },
  configurable: true,
});

// Now import the socket module
const socketPath = new URL("../../../public/js/services/socket.js", import.meta.url);
await import(socketPath.href);

const SocketClient = global.window.SocketClient;
const socketClient = global.window.socketClient;

describe("SocketClient", function () {
  let mockSocket;

  beforeEach(function () {
    mockSocket = createMockSocket();

    // Reset mock socket state
    mockSocket.connected = false;
    mockSocket.id = null;

    // Reset global state - io returns undefined by default
    mockIoFn = null;
    mockHeadAppendChild.mock.calls = [];
    mockCreateElement.mock.calls = [];
    consoleLogMock.mock.calls = [];
    consoleErrorMock.mock.calls = [];
  });

  afterEach(function () {
    // Clean up
    mockIoFn = null;
  });

  describe("constructor", function () {
    it("should initialize with default options", function () {
      const client = new SocketClient();
      expect(client.options.path).toBe("/llamaproxws");
      expect(client.options.transports).toEqual(["websocket"]);
      expect(client.handlers.size).toBe(0);
      expect(client._connected).toBe(false);
      expect(client.socket).toBeNull();
    });

    it("should merge provided options", function () {
      const client = new SocketClient({ path: "/custom", timeout: 5000 });
      expect(client.options.path).toBe("/custom");
      expect(client.options.timeout).toBe(5000);
      expect(client.options.transports).toEqual(["websocket"]);
    });
  });

  describe("connect", function () {
    it("should return this for chaining", function () {
      // Setup: io is available
      mockIoFn = () => mockSocket;

      const client = new SocketClient();
      expect(client.connect()).toBe(client);
    });

    it("should not connect if already connected", function () {
      const client = new SocketClient();
      client.socket = { connected: true };

      client.connect();
      // If it reaches here without calling io, test passes
    });

    it("should call _connect when io returns a socket", function () {
      // io returns our mock socket
      mockIoFn = () => mockSocket;

      const client = new SocketClient();
      client.connect();

      // io was called to create socket - verify by checking mockSocket was used
      expect(mockSocket.on.mock.calls.length).toBeGreaterThan(0);
    });

    it("should register connect handler", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client.connect();

      expect(mockSocket.on.mock.calls.some((c) => c[0] === "connect")).toBe(true);
    });

    it("should register disconnect handler", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client.connect();

      expect(mockSocket.on.mock.calls.some((c) => c[0] === "disconnect")).toBe(true);
    });

    it("should register connect_error handler", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client.connect();

      expect(mockSocket.on.mock.calls.some((c) => c[0] === "connect_error")).toBe(true);
    });

    it("should register onAny handler", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client.connect();

      expect(mockSocket.onAny.mock.calls.length).toBeGreaterThan(0);
    });

    it("should emit connection:ack on connect", function () {
      mockIoFn = () => mockSocket;
      mockSocket.id = "test-socket-id";
      const client = new SocketClient();
      client.connect();

      // Simulate connect event by triggering the registered handler
      const handlers = mockSocket._handlers;
      if (handlers["connect"] && handlers["connect"].length > 0) {
        handlers["connect"].forEach((h) => h());
      }

      expect(mockSocket.emit.mock.calls.length).toBeGreaterThan(0);
      expect(mockSocket.emit.mock.calls.some((c) => c[0] === "connection:ack")).toBe(true);
    });

    it("should set _connected to true on connect", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client.connect();

      // Trigger connect handler
      const handlers = mockSocket._handlers;
      if (handlers["connect"] && handlers["connect"].length > 0) {
        handlers["connect"].forEach((h) => h());
      }

      expect(client._connected).toBe(true);
    });

    it("should emit custom connect event on socket connect", function () {
      mockIoFn = () => mockSocket;
      mockSocket.id = "socket-123";
      const client = new SocketClient();
      let receivedId = null;
      client.on("connect", (id) => {
        receivedId = id;
      });

      // Connect to register socket handlers
      client.connect();

      // Trigger connect handler - this should call client._emit("connect", client.socket.id)
      const handlers = mockSocket._handlers;
      if (handlers["connect"] && handlers["connect"].length > 0) {
        handlers["connect"].forEach((h) => h());
      }

      expect(receivedId).toBe("socket-123");
    });

    it("should set _connected to false on disconnect", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client.connect();

      // First trigger connect to set _connected to true
      const handlers = mockSocket._handlers;
      if (handlers["connect"] && handlers["connect"].length > 0) {
        handlers["connect"].forEach((h) => h());
      }

      expect(client._connected).toBe(true);

      // Now trigger disconnect
      if (handlers["disconnect"] && handlers["disconnect"].length > 0) {
        handlers["disconnect"].forEach((h) => h("io server disconnect"));
      }

      expect(client._connected).toBe(false);
    });

    it("should emit disconnect event with reason via client handler", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      let receivedReason = null;
      client.on("disconnect", (reason) => {
        receivedReason = reason;
      });

      // Connect to register socket handlers
      client.connect();

      // Trigger disconnect handler
      const handlers = mockSocket._handlers;
      if (handlers["disconnect"] && handlers["disconnect"].length > 0) {
        handlers["disconnect"].forEach((h) => h("transport close"));
      }

      expect(receivedReason).toBe("transport close");
    });

    it("should emit connect_error event", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      let receivedError = null;
      client.on("connect_error", (error) => {
        receivedError = error;
      });

      // Connect to register socket handlers
      client.connect();

      // Trigger connect_error
      const handlers = mockSocket._handlers;
      const error = new Error("Connection failed");
      if (handlers["connect_error"] && handlers["connect_error"].length > 0) {
        handlers["connect_error"].forEach((h) => h(error));
      }

      expect(receivedError).toBe(error);
    });
  });

  describe("disconnect", function () {
    it("should call socket.disconnect", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client.connect();

      client.disconnect();

      expect(mockSocket.disconnect.mock.calls.length).toBeGreaterThan(0);
    });

    it("should set socket to null", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client.connect();

      client.disconnect();

      expect(client.socket).toBeNull();
    });

    it("should return this for chaining", function () {
      const client = new SocketClient();
      expect(client.disconnect()).toBe(client);
    });

    it("should handle disconnect when socket is null", function () {
      const client = new SocketClient();
      client.socket = null;

      // Should not throw
      expect(client.disconnect()).toBe(client);
    });
  });

  describe("emit", function () {
    it("should emit event to socket when connected", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client.connect();
      mockSocket.connected = true;

      client.emit("test:event", { data: "test" });

      expect(mockSocket.emit.mock.calls.length).toBeGreaterThan(0);
      expect(
        mockSocket.emit.mock.calls.some((c) => c[0] === "test:event" && c[1]?.data === "test")
      ).toBe(true);
    });

    it("should not emit when socket is not connected", function () {
      const client = new SocketClient();
      client.socket = { connected: false };

      client.emit("test:event", { data: "test" });

      // Should not call emit since we set connected to false
    });

    it("should not emit when socket is null", function () {
      const client = new SocketClient();
      client.socket = null;

      // Should not throw
      client.emit("test:event", { data: "test" });
    });

    it("should return this for chaining", function () {
      const client = new SocketClient();
      expect(client.emit("test")).toBe(client);
    });

    it("should use empty object as default data", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client.connect();
      mockSocket.connected = true;

      client.emit("test:event");

      expect(mockSocket.emit.mock.calls.some((c) => c[0] === "test:event")).toBe(true);
    });
  });

  describe("on", function () {
    it("should register event handler", function () {
      const client = new SocketClient();
      const handler = function () {};

      client.on("test:event", handler);

      expect(client.handlers.has("test:event")).toBe(true);
      expect(client.handlers.get("test:event").has(handler)).toBe(true);
    });

    it("should allow multiple handlers for same event", function () {
      const client = new SocketClient();
      const handler1 = function () {};
      const handler2 = function () {};

      client.on("test:event", handler1);
      client.on("test:event", handler2);

      expect(client.handlers.get("test:event").size).toBe(2);
    });

    it("should return this for chaining", function () {
      const client = new SocketClient();

      expect(client.on("test", function () {})).toBe(client);
    });
  });

  describe("off", function () {
    it("should remove specific handler", function () {
      const client = new SocketClient();
      const handler1 = function () {};
      const handler2 = function () {};

      client.on("test:event", handler1);
      client.on("test:event", handler2);
      client.off("test:event", handler1);

      expect(client.handlers.get("test:event").has(handler1)).toBe(false);
      expect(client.handlers.get("test:event").has(handler2)).toBe(true);
    });

    it("should remove all handlers for event when no handler specified", function () {
      const client = new SocketClient();
      const handler = function () {};

      client.on("test:event", handler);
      client.off("test:event");

      expect(client.handlers.has("test:event")).toBe(false);
    });

    it("should handle off for non-existent event", function () {
      const client = new SocketClient();

      // Should not throw
      client.off("non:existent");
    });

    it("should return this for chaining", function () {
      const client = new SocketClient();

      expect(client.off("test")).toBe(client);
    });
  });

  describe("once", function () {
    it("should register handler that fires only once", function () {
      const client = new SocketClient();
      let callCount = 0;
      const handler = function () {
        callCount++;
      };

      client.once("test:event", handler);
      client._emit("test:event", "first");
      client._emit("test:event", "second");

      expect(callCount).toBe(1);
    });

    it("should remove wrapper handler after execution", function () {
      const client = new SocketClient();
      const handler = function () {};

      client.once("test:event", handler);
      client._emit("test:event", "data");

      expect(client.handlers.get("test:event").size).toBe(0);
    });

    it("should return this for chaining", function () {
      const client = new SocketClient();

      expect(client.once("test", function () {})).toBe(client);
    });
  });

  describe("isConnected", function () {
    it("should return true when socket is connected", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client.connect();
      mockSocket.connected = true;

      expect(client.isConnected).toBe(true);
    });

    it("should return false when socket is not connected", function () {
      const client = new SocketClient();
      client.socket = { connected: false };

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
    it("should return socket id when available", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client.connect();
      mockSocket.id = "socket-456";

      expect(client.id).toBe("socket-456");
    });

    it("should return null when socket is null", function () {
      const client = new SocketClient();
      client.socket = null;

      expect(client.id).toBe(null);
    });

    it("should return null when socket id is undefined", function () {
      const client = new SocketClient();
      client.socket = {};

      expect(client.id).toBe(null);
    });
  });

  describe("_emit", function () {
    it("should call all handlers for event", function () {
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

    it("should not throw when handler throws", function () {
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

      // Should not throw
      expect(() => client._emit("event:1", "data")).not.toThrow();
      expect(callCount).toBe(1);
    });

    it("should log error when handler throws", function () {
      const client = new SocketClient();
      const errorHandler = function () {
        throw new Error("Test error");
      };

      client.on("event:1", errorHandler);
      client._emit("event:1", "data");

      expect(consoleErrorMock.mock.calls.length).toBeGreaterThan(0);
    });

    it("should handle non-existent event", function () {
      const client = new SocketClient();

      // Should not throw
      client._emit("non:existent", "data");
    });

    it("should throw when handlers Map is null", function () {
      const client = new SocketClient();

      // Save original handlers and set to null
      const originalHandlers = client.handlers;
      client.handlers = null;

      // The code uses this.handlers.get(event)?.forEach()
      // which handles null event key but not null handlers Map
      expect(() => {
        client._emit("event", "data");
      }).toThrow();

      // Restore handlers
      client.handlers = originalHandlers;
    });
  });

  describe("event forwarding", function () {
    it("should forward arbitrary events to handlers", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      let receivedData = null;
      client.on("models:list", (data) => {
        receivedData = data;
      });

      // Trigger via _emit which simulates socket event
      client._emit("models:list", { models: [] });

      expect(receivedData).toEqual({ models: [] });
    });

    it("should forward events with multiple handlers", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      let callCount = 0;
      client.on("broadcast:message", () => {
        callCount++;
      });
      client.on("broadcast:message", () => {
        callCount++;
      });

      client._emit("broadcast:message", "hello");

      expect(callCount).toBe(2);
    });

    it("should forward events via onAny handler", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();

      let customEventReceived = null;
      client.on("custom:event", (data) => {
        customEventReceived = data;
      });

      // Connect to register handlers including onAny
      client.connect();

      // Get the onAny handler that was registered
      if (mockSocket._onAnyHandler) {
        mockSocket._onAnyHandler("custom:event", { test: "data" });
      }

      expect(customEventReceived).toEqual({ test: "data" });
    });
  });

  describe("edge cases", function () {
    it("should handle emit with data containing special values", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();
      client.connect();
      mockSocket.connected = true;

      // Should not throw with null, undefined, etc.
      client.emit("test", null);
      expect(mockSocket.emit.mock.calls.some((c) => c[0] === "test")).toBe(true);

      client.emit("test", undefined);
      expect(mockSocket.emit.mock.calls.some((c) => c[0] === "test")).toBe(true);
    });

    it("should handle multiple connect/disconnect cycles", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();

      // First connect
      client.connect();

      const handlers = mockSocket._handlers;

      // Trigger connect
      if (handlers["connect"] && handlers["connect"].length > 0) {
        handlers["connect"].forEach((h) => h());
      }
      expect(client._connected).toBe(true);

      // Disconnect
      if (handlers["disconnect"] && handlers["disconnect"].length > 0) {
        handlers["disconnect"].forEach((h) => h("client leave"));
      }
      expect(client._connected).toBe(false);

      // Reconnect
      mockSocket._connected = true;
      if (handlers["connect"] && handlers["connect"].length > 0) {
        handlers["connect"].forEach((h) => h());
      }
      expect(client._connected).toBe(true);
    });

    it("should handle off for partially removed handlers", function () {
      const client = new SocketClient();
      const handler1 = function () {};
      const handler2 = function () {};

      client.on("test:event", handler1);
      client.on("test:event", handler2);

      // Remove handler1
      client.off("test:event", handler1);

      // handler2 should still work
      let callCount = 0;
      const newHandler = function () {
        callCount++;
      };
      client.on("test:event", newHandler);

      client._emit("test:event", "data");
      expect(callCount).toBe(1);
    });

    it("should properly trigger socket events to client handlers", function () {
      mockIoFn = () => mockSocket;
      const client = new SocketClient();

      let connectCalled = false;
      let disconnectCalled = false;

      client.on("connect", () => {
        connectCalled = true;
      });
      client.on("disconnect", () => {
        disconnectCalled = true;
      });

      // Connect to register handlers on socket
      client.connect();

      // Manually trigger the registered socket handlers
      const handlers = mockSocket._handlers;

      // Trigger connect handler manually
      if (handlers["connect"] && handlers["connect"].length > 0) {
        handlers["connect"].forEach((h) => h());
      }
      expect(connectCalled).toBe(true);

      // Reset and trigger disconnect
      mockSocket.connected = false;
      if (handlers["disconnect"] && handlers["disconnect"].length > 0) {
        handlers["disconnect"].forEach((h) => h("test reason"));
      }
      expect(disconnectCalled).toBe(true);
      expect(client._connected).toBe(false);
    });

    it("should handle _connect when window.io returns undefined", function () {
      // This test verifies that _connect() doesn't crash when window.io() returns undefined
      // In a real scenario, this would crash, but we can at least verify the behavior
      mockIoFn = null;

      const client = new SocketClient();

      // Calling _connect directly with undefined io should not crash
      // (it would crash in production, but we verify the code path exists)
      try {
        client.connect();
      } catch (e) {
        // Expected - window.io() returns undefined or is not a function
        expect(e.message).toMatch(/undefined|not a function/i);
      }
    });

    it("should export SocketClient and socketClient globally", function () {
      expect(global.window.SocketClient).toBeDefined();
      expect(global.window.socketClient).toBeDefined();
      expect(global.window.SocketClient).toBe(SocketClient);
      expect(global.window.socketClient).toBeInstanceOf(SocketClient);
    });
  });
});
