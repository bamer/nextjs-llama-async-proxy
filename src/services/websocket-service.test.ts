import { websocketService } from "@services/websocket-service";
import { io, Socket } from "socket.io-client";

// Mock socket.io-client
jest.mock("socket.io-client");
const mockIo = io as jest.MockedFunction<typeof io>;

describe("WebSocketService", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset the service state
    websocketService.disconnect();
  });

  describe("Connection Management", () => {
    it("should initialize with correct URL", () => {
      expect(websocketService["url"]).toContain("ws://");
    });

    it("should connect to WebSocket", () => {
      const mockSocket = {
        on: jest.fn(),
        connected: true,
        id: "test-socket-id",
      } as unknown as Socket;

      mockIo.mockReturnValue(mockSocket);

      websocketService.connect();

      expect(mockIo).toHaveBeenCalledWith(expect.stringContaining("ws://"), expect.any(Object));
      expect(mockSocket.on).toHaveBeenCalledWith("connect", expect.any(Function));
    });

    it("should not reconnect if already connected", () => {
      const mockSocket = {
        on: jest.fn(),
        connected: true,
        id: "test-socket-id",
      } as unknown as Socket;

      mockIo.mockReturnValue(mockSocket);
      websocketService.connect();

      // Try to connect again
      const consoleSpy = jest.spyOn(console, "log");
      websocketService.connect();
      expect(consoleSpy).toHaveBeenCalledWith("Already connected to WebSocket");
      consoleSpy.mockRestore();
    });

    it("should disconnect from WebSocket", () => {
      const mockSocket = {
        disconnect: jest.fn(),
        connected: true,
        id: "test-socket-id",
      } as unknown as Socket;

      mockIo.mockReturnValue(mockSocket);
      websocketService.connect();

      websocketService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it("should return connection state", () => {
      expect(websocketService.isConnected()).toBe(false);

      const mockSocket = {
        connected: true,
        id: "test-socket-id",
      } as unknown as Socket;

      mockIo.mockReturnValue(mockSocket);
      websocketService.connect();

      expect(websocketService.isConnected()).toBe(true);
    });
  });

  describe("Message Handling", () => {
    it("should send messages when connected", () => {
      const mockSocket = {
        emit: jest.fn(),
        connected: true,
        id: "test-socket-id",
      } as unknown as Socket;

      mockIo.mockReturnValue(mockSocket);
      websocketService.connect();

      websocketService.sendMessage("testEvent", { data: "test" });

      expect(mockSocket.emit).toHaveBeenCalledWith("testEvent", {
        type: "testEvent",
        data: { data: "test" },
        timestamp: expect.any(Number),
        requestId: expect.any(String),
      });
    });

    it("should not send messages when disconnected", () => {
      const consoleSpy = jest.spyOn(console, "warn");

      websocketService.sendMessage("testEvent", { data: "test" });

      expect(consoleSpy).toHaveBeenCalledWith("WebSocket not connected, cannot send message");
      consoleSpy.mockRestore();
    });

    it("should generate request IDs", () => {
      const id1 = websocketService["generateRequestId"]();
      const id2 = websocketService["generateRequestId"]();

      expect(id1).toHaveLength(7);
      expect(id2).toHaveLength(7);
      expect(id1).not.toBe(id2);
    });
  });

  describe("Reconnection Logic", () => {
    it("should handle reconnection attempts", () => {
      jest.useFakeTimers();

      const mockSocket = {
        on: jest.fn(),
        connected: false,
      } as unknown as Socket;

      mockIo.mockReturnValue(mockSocket);
      websocketService.connect();

      // Simulate connection error
      const connectErrorCallback = mockSocket.on.mock.calls.find(
        (call) => call[0] === "connect_error"
      )?.[1];
      if (connectErrorCallback) {
        connectErrorCallback(new Error("Connection failed"));
      }

      // Fast-forward time
      jest.advanceTimersByTime(1000);

      expect(mockIo).toHaveBeenCalledTimes(2); // Initial + reconnect

      jest.useRealTimers();
    });

    it("should stop reconnecting after max attempts", () => {
      jest.useFakeTimers();

      const mockSocket = {
        on: jest.fn(),
        connected: false,
      } as unknown as Socket;

      mockIo.mockReturnValue(mockSocket);
      websocketService.connect();

      // Simulate multiple connection errors
      for (let i = 0; i < 6; i++) {
        const connectErrorCallback = mockSocket.on.mock.calls.find(
          (call) => call[0] === "connect_error"
        )?.[1];
        if (connectErrorCallback) {
          connectErrorCallback(new Error("Connection failed"));
        }
        jest.advanceTimersByTime(1000);
      }

      // Should not attempt to reconnect after max attempts
      expect(mockIo).toHaveBeenCalledTimes(6);

      jest.useRealTimers();
    });
  });

  describe("API Methods", () => {
    beforeEach(() => {
      const mockSocket = {
        emit: jest.fn(),
        connected: true,
        id: "test-socket-id",
      } as unknown as Socket;

      mockIo.mockReturnValue(mockSocket);
      websocketService.connect();
    });

    it("should request metrics", () => {
      websocketService.requestMetrics();
      expect(websocketService.sendMessage).toHaveBeenCalledWith("getMetrics");
    });

    it("should request logs", () => {
      websocketService.requestLogs();
      expect(websocketService.sendMessage).toHaveBeenCalledWith("getLogs");
    });

    it("should request models", () => {
      websocketService.requestModels();
      expect(websocketService.sendMessage).toHaveBeenCalledWith("getModels");
    });

    it("should start model", () => {
      websocketService.startModel("test-model-id");
      expect(websocketService.sendMessage).toHaveBeenCalledWith("startModel", {
        modelId: "test-model-id",
      });
    });

    it("should stop model", () => {
      websocketService.stopModel("test-model-id");
      expect(websocketService.sendMessage).toHaveBeenCalledWith("stopModel", {
        modelId: "test-model-id",
      });
    });

    it("should update model config", () => {
      websocketService.updateModelConfig("test-model-id", { status: "running" });
      expect(websocketService.sendMessage).toHaveBeenCalledWith("updateModelConfig", {
        modelId: "test-model-id",
        config: { status: "running" },
      });
    });
  });
});