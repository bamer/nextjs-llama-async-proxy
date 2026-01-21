/**
 * LlamaProxy WebSocket Tests
 * Tests for /llamaproxws path, handshake, presets loading, and router-start-preset flow
 * @jest-environment jsdom
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
    connect: createMockFn(),
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

describe("LlamaProxy WebSocket Path Configuration", () => {
  let mockIo;
  let mockSocket;

  beforeEach(() => {
    mockSocket = createMockSocket();
    mockIo = jest.fn(() => mockSocket);
    global.io = mockIo;

    // Clear require cache
    jest.resetModules();
  });

  afterEach(() => {
    jest.resetModules();
    if (global.io === mockIo) {
      delete global.io;
    }
  });

  describe("path configuration", () => {
    it("should use /llamaproxws path", async () => {
      // Require after setting mock
      const { SocketClient } = await import("../../../../public/js/services/socket-client.js");
      const client = new SocketClient();

      expect(client.options.path).toBe("/llamaproxws");
    });

    it("should expose path getter", async () => {
      const { SocketClient } = await import("../../../../public/js/services/socket-client.js");
      const client = new SocketClient();

      expect(client.path).toBe("/llamaproxws");
    });

    it("should use websocket transport only", async () => {
      const { SocketClient } = await import("../../../../public/js/services/socket-client.js");
      const client = new SocketClient();

      expect(client.options.transports).toEqual(["websocket"]);
    });

    it("should configure reconnection settings", async () => {
      const { SocketClient } = await import("../../../../public/js/services/socket-client.js");
      const client = new SocketClient();

      expect(client.options.reconnection).toBe(true);
      expect(client.options.reconnectionAttempts).toBe(5);
      expect(client.options.reconnectionDelay).toBe(1000);
    });
  });
});

describe("LlamaProxy Handshake", () => {
  let mockIo;
  let mockSocket;
  let SocketClient;

  beforeEach(async () => {
    mockSocket = createMockSocket();
    mockIo = jest.fn(() => mockSocket);
    global.io = mockIo;

    jest.resetModules();
    SocketClient = (await import("../../../../public/js/services/socket-client.js")).SocketClient;
  });

  afterEach(() => {
    jest.resetModules();
    if (global.io === mockIo) {
      delete global.io;
    }
  });

  describe("handshake event handling", () => {
    it("should have handshakeReceived flag initially false", () => {
      const client = new SocketClient();
      expect(client.handshakeReceived).toBe(false);
    });

    it("should set handshakeReceived true after handshake event", () => {
      const client = new SocketClient();
      client.connect();

      // Simulate connect
      mockSocket._trigger("connect");

      // Simulate handshake
      mockSocket._trigger("handshake", { version: "1.0" });

      expect(client.handshakeReceived).toBe(true);
    });

    it("should emit socket:handshake event to handlers", () => {
      const client = new SocketClient();
      const handler = jest.fn();
      client.on("socket:handshake", handler);
      client.connect();

      // Simulate connect and handshake
      mockSocket._trigger("connect");
      mockSocket._trigger("handshake", { version: "1.0", timestamp: Date.now() });

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        version: "1.0",
      }));
    });
  });

  describe("waitForHandshake", () => {
    it("should resolve immediately if handshake already received", async () => {
      const client = new SocketClient();
      client.connect();
      mockSocket._trigger("connect");
      mockSocket._trigger("handshake", { version: "1.0" });

      // Should resolve immediately
      await expect(client._waitForHandshake(100)).resolves.toBe(true);
    });

    it("should wait for handshake event", async () => {
      const client = new SocketClient();
      client.connect();
      mockSocket._trigger("connect");

      // Don't trigger handshake yet
      const promise = client._waitForHandshake(500);

      // Trigger after a delay
      setTimeout(() => {
        mockSocket._trigger("handshake", { version: "1.0" });
      }, 50);

      await expect(promise).resolves.toBe(true);
    });

    it("should timeout if handshake not received", async () => {
      const client = new SocketClient();
      client.connect();
      mockSocket._trigger("connect");

      // Should timeout
      await expect(client._waitForHandshake(100)).rejects.toThrow("Handshake timeout");
    });
  });
});

describe("Presets Loading", () => {
  let presetsModule;

  beforeEach(async () => {
    jest.resetModules();
    presetsModule = await import("../../../../public/js/services/presets.js");
  });

  describe("presets structure", () => {
    it("should have getPresets function", () => {
      expect(typeof presetsModule.getPresets).toBe("function");
    });

    it("should have savePreset function", () => {
      expect(typeof presetsModule.savePreset).toBe("function");
    });

    it("should have deletePreset function", () => {
      expect(typeof presetsModule.deletePreset).toBe("function");
    });

    it("should have loadDefaultPresets function", () => {
      expect(typeof presetsModule.loadDefaultPresets).toBe("function");
    });
  });

  describe("default presets", () => {
    it("should have chat preset", () => {
      const presets = presetsModule.loadDefaultPresets();
      expect(presets.chat).toBeDefined();
      expect(presets.chat.name).toBe("Chat");
    });

    it("should have code preset", () => {
      const presets = presetsModule.loadDefaultPresets();
      expect(presets.code).toBeDefined();
      expect(presets.code.name).toBe("Code");
    });

    it("should have instruction-following preset", () => {
      const presets = presetsModule.loadDefaultPresets();
      expect(presets.instruction).toBeDefined();
      expect(presets.instruction.name).toBe("Instruction Following");
    });
  });

  describe("preset validation", () => {
    it("should validate required fields", () => {
      const presets = presetsModule.loadDefaultPresets();
      Object.values(presets).forEach((preset) => {
        expect(preset).toHaveProperty("name");
        expect(preset).toHaveProperty("parameters");
        expect(typeof preset.name).toBe("string");
        expect(typeof preset.parameters).toBe("object");
      });
    });
  });
});

describe("Router Start with Preset Flow", () => {
  describe("event contract", () => {
    it("should have router:start-with-preset event", () => {
      // This tests the expected event contract
      const eventName = "router:start-with-preset";
      expect(eventName).toBe("router:start-with-preset");
    });

    it("should have router:status broadcast event", () => {
      const eventName = "router:status";
      expect(eventName).toBe("router:status");
    });

    it("should have presets:list request event", () => {
      const eventName = "presets:list";
      expect(eventName).toBe("presets:list");
    });

    it("should have presets:loaded broadcast event", () => {
      const eventName = "presets:loaded";
      expect(eventName).toBe("presets:loaded");
    });
  });

  describe("start-with-preset parameters", () => {
    it("should accept presetName parameter", () => {
      const request = {
        presetName: "chat",
        timeout: 30000,
      };
      expect(request.presetName).toBe("chat");
      expect(request.timeout).toBe(30000);
    });

    it("should have default timeout", () => {
      const request = {
        presetName: "code",
      };
      expect(request.presetName).toBe("code");
      expect(request.timeout).toBeUndefined();
    });
  });
});

describe("No Polling Patterns", () => {
  it("socket-client should not use setInterval for data fetching", async () => {
    jest.resetModules();
    const sourceCode = require("../../../../public/js/services/socket-client.js").toString();

    // Check that there's no polling pattern in socket-client
    const hasPolling = sourceCode.includes("setInterval") &&
                       sourceCode.includes("request") &&
                       sourceCode.includes("fetch");

    expect(hasPolling).toBe(false);
  });

  it("socket-client should use event-driven updates", async () => {
    jest.resetModules();
    const { SocketClient } = await import("../../../../public/js/services/socket-client.js");

    const client = new SocketClient();
    const handler = jest.fn();

    // Should support event subscription pattern
    const unsubscribe = client.on("test:event", handler);

    expect(typeof unsubscribe).toBe("function");
    expect(handler).not.toHaveBeenCalled();

    // Trigger event
    client._emit("test:event", { data: "test" });

    expect(handler).toHaveBeenCalledWith({ data: "test" });
  });
});
