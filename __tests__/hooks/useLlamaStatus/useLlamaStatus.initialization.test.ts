import { renderHook, act } from "@testing-library/react";
import { useLlamaStatus } from "@/hooks/useLlamaStatus";
import { createDefaultStatusMessage } from "./useLlamaStatus.test-utils";

jest.mock("@/lib/websocket-client", () => ({
  websocketServer: {
    on: jest.fn(),
    off: jest.fn(),
    sendMessage: jest.fn(),
    getSocket: jest.fn(() => null),
  },
}));

describe("useLlamaStatus Initialization", () => {
  const { websocketServer } = jest.mocked(require("@/lib/websocket-client"));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with initial state and loading", () => {
    const { result } = renderHook(() => useLlamaStatus());

    expect(result.current.status).toBe("initial");
    expect(result.current.models).toEqual([]);
    expect(result.current.lastError).toBe(null);
    expect(result.current.retries).toBe(0);
    expect(result.current.uptime).toBe(0);
    expect(result.current.startedAt).toBe(null);
    expect(result.current.isLoading).toBe(true);
  });

  it("should request initial status on mount", () => {
    renderHook(() => useLlamaStatus());

    expect(websocketServer.sendMessage).toHaveBeenCalledWith("requestLlamaStatus");
    expect(websocketServer.sendMessage).toHaveBeenCalledTimes(1);
  });

  it("should set up message event listener on mount", () => {
    renderHook(() => useLlamaStatus());

    expect(websocketServer.on).toHaveBeenCalledWith("message", expect.any(Function));
    expect(websocketServer.on).toHaveBeenCalledTimes(1);
  });

  it("should cleanup message listener on unmount", () => {
    const { unmount } = renderHook(() => useLlamaStatus());

    expect(websocketServer.on).toHaveBeenCalledTimes(1);
    expect(websocketServer.off).not.toHaveBeenCalled();

    unmount();

    expect(websocketServer.off).toHaveBeenCalledWith("message", expect.any(Function));
    expect(websocketServer.off).toHaveBeenCalledTimes(1);
  });

  it("should set up socket listener when socket is available", () => {
    const mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
    };

    websocketServer.getSocket.mockReturnValue(mockSocket);

    renderHook(() => useLlamaStatus());

    expect(mockSocket.on).toHaveBeenCalledWith("llamaStatus", expect.any(Function));
  });

  it("should not set up socket listener when socket is null", () => {
    websocketServer.getSocket.mockReturnValue(null);

    renderHook(() => useLlamaStatus());

    expect(websocketServer.on).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("should ignore messages that are not llama_status type", async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    const initialStatus = result.current.status;

    act(() => {
      messageHandler({ type: "metrics", data: { cpu: 50 } });
    });

    expect(result.current.status).toBe(initialStatus);
  });

  it("should handle messages with missing data property", async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    const initialStatus = result.current.status;

    act(() => {
      messageHandler({ type: "llama_status" });
    });

    expect(result.current.status).toBe(initialStatus);
  });

  it("should handle messages with null data", async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    const initialStatus = result.current.status;

    act(() => {
      messageHandler({ type: "llama_status", data: null });
    });

    expect(result.current.status).toBe(initialStatus);
  });
});
