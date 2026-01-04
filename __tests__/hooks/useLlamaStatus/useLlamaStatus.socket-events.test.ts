import { renderHook, act } from "@testing-library/react";
import { useLlamaStatus } from "@/hooks/useLlamaStatus";
import { createDefaultStatusMessage } from "./useLlamaStatus.test-utils";
import { createMockSocket } from "./useLlamaStatus.test-utils";

jest.mock("@/lib/websocket-client", () => ({
  websocketServer: {
    on: jest.fn(),
    off: jest.fn(),
    sendMessage: jest.fn(),
    getSocket: jest.fn(() => null),
  },
}));

describe("useLlamaStatus Socket Events", () => {
  const { websocketServer } = jest.mocked(require("@/lib/websocket-client"));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle llamaStatus event from socket", () => {
    const mockSocket = createMockSocket();
    websocketServer.getSocket.mockReturnValue(mockSocket);

    const { result } = renderHook(() => useLlamaStatus());

    const socketHandler = mockSocket.on.mock.calls.find(
      (call: unknown[]) => call[0] === "llamaStatus"
    )?.[1];

    expect(socketHandler).toBeDefined();

    const statusData = {
      data: {
        status: "ready",
        models: [{ id: "m1", name: "Socket Model" }],
        lastError: null,
        retries: 0,
        uptime: 500,
        startedAt: "2025-01-01T11:00:00Z",
      },
    };

    act(() => {
      socketHandler(statusData);
    });

    expect(result.current.status).toBe("ready");
    expect(result.current.models).toEqual([{ id: "m1", name: "Socket Model" }]);
    expect(result.current.uptime).toBe(500);
    expect(result.current.startedAt).toBe("2025-01-01T11:00:00Z");
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle concurrent updates from message and socket", () => {
    const mockSocket = createMockSocket();
    websocketServer.getSocket.mockReturnValue(mockSocket);

    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];
    const socketHandler = mockSocket.on.mock.calls.find(
      (call: unknown[]) => call[0] === "llamaStatus"
    )?.[1];

    // Act - update via message first
    act(() => {
      messageHandler(createDefaultStatusMessage({ status: "starting" }));
    });

    expect(result.current.status).toBe("starting");

    // Act - update via socket
    act(() => {
      socketHandler({
        data: createDefaultStatusMessage({
          status: "ready",
          models: [{ id: "m1", name: "Model" }],
          retries: 1,
          uptime: 1000,
          startedAt: "2025-01-01T12:00:00Z",
        }).data,
      });
    });

    // Assert - socket update should be reflected
    expect(result.current.status).toBe("ready");
    expect(result.current.models).toEqual([{ id: "m1", name: "Model" }]);
    expect(result.current.retries).toBe(1);
    expect(result.current.uptime).toBe(1000);
  });

  it("should handle models array correctly when empty", async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    act(() => {
      messageHandler(createDefaultStatusMessage({
        status: "stopped",
        models: null,
      }));
    });

    expect(result.current.models).toEqual([]);
  });

  it("should handle models array when undefined", async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    act(() => {
      messageHandler({
        type: "llama_status",
        data: {
          status: "loading",
          lastError: null,
          retries: 0,
          uptime: 0,
          startedAt: null,
        },
      });
    });

    expect(result.current.models).toEqual([]);
  });

  it("should handle last error in status", async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    act(() => {
      messageHandler(createDefaultStatusMessage({
        status: "error",
        lastError: "Failed to load model",
        retries: 5,
      }));
    });

    expect(result.current.status).toBe("error");
    expect(result.current.lastError).toBe("Failed to load model");
    expect(result.current.retries).toBe(5);
  });
});
