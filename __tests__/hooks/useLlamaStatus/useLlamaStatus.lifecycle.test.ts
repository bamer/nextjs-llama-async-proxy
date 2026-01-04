import { renderHook, act } from "@testing-library/react";
import { useLlamaStatus } from "@/hooks/useLlamaStatus";
import { createDefaultStatusMessage, allStatusTypes } from "./useLlamaStatus.test-utils";

jest.mock("@/lib/websocket-client", () => ({
  websocketServer: {
    on: jest.fn(),
    off: jest.fn(),
    sendMessage: jest.fn(),
    getSocket: jest.fn(() => null),
  },
}));

describe("useLlamaStatus Lifecycle", () => {
  const { websocketServer } = jest.mocked(require("@/lib/websocket-client"));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should set loading to false when data is received", async () => {
    const { result } = renderHook(() => useLlamaStatus());

    expect(result.current.isLoading).toBe(true);

    const messageHandler = websocketServer.on.mock.calls[0][1];

    act(() => {
      messageHandler(createDefaultStatusMessage());
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("should handle multiple status updates", async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    act(() => {
      messageHandler(createDefaultStatusMessage({ status: "loading" }));
    });

    expect(result.current.status).toBe("loading");

    act(() => {
      messageHandler(createDefaultStatusMessage({
        status: "running",
        models: [{ id: "m1", name: "M1" }],
      }));
    });

    expect(result.current.status).toBe("running");
    expect(result.current.models).toEqual([{ id: "m1", name: "M1" }]);
    expect(result.current.uptime).toBe(0);
  });

  allStatusTypes.forEach((status) => {
    it(`should handle status: ${status}`, () => {
      const { result } = renderHook(() => useLlamaStatus());
      const messageHandler = websocketServer.on.mock.calls[0][1];

      act(() => {
        messageHandler(createDefaultStatusMessage({ status }));
      });

      expect(result.current.status).toBe(status);
    });
  });

  it("should handle status lifecycle: initial -> starting -> ready", () => {
    const { result } = renderHook(() => useLlamaStatus());
    const messageHandler = websocketServer.on.mock.calls[0][1];

    // Initial state
    expect(result.current.status).toBe("initial");

    // Transition to starting
    act(() => {
      messageHandler(createDefaultStatusMessage({ status: "starting" }));
    });

    expect(result.current.status).toBe("starting");
    expect(result.current.isLoading).toBe(false);

    // Transition to ready
    act(() => {
      messageHandler(createDefaultStatusMessage({
        status: "ready",
        models: [{ id: "m1", name: "Model 1" }],
        uptime: 100,
        startedAt: "2025-01-01T10:00:00Z",
      }));
    });

    expect(result.current.status).toBe("ready");
    expect(result.current.models).toHaveLength(1);
    expect(result.current.uptime).toBe(100);
    expect(result.current.startedAt).toBe("2025-01-01T10:00:00Z");
  });

  it("should handle error -> crashed transition", () => {
    const { result } = renderHook(() => useLlamaStatus());
    const messageHandler = websocketServer.on.mock.calls[0][1];

    // Error state
    act(() => {
      messageHandler(createDefaultStatusMessage({
        status: "error",
        lastError: "Connection failed",
        retries: 3,
        uptime: 5000,
      }));
    });

    expect(result.current.status).toBe("error");
    expect(result.current.lastError).toBe("Connection failed");

    // Crash state
    act(() => {
      messageHandler(createDefaultStatusMessage({
        status: "crashed",
        lastError: "Process crashed: SIGSEGV",
        retries: 5,
        uptime: 10000,
      }));
    });

    expect(result.current.status).toBe("crashed");
    expect(result.current.lastError).toBe("Process crashed: SIGSEGV");
    expect(result.current.retries).toBe(5);
  });

  it("should handle ready -> stopping -> stopped transition", () => {
    const { result } = renderHook(() => useLlamaStatus());
    const messageHandler = websocketServer.on.mock.calls[0][1];

    // Ready state
    act(() => {
      messageHandler(createDefaultStatusMessage({
        status: "ready",
        models: [{ id: "m1", name: "Model" }],
        uptime: 60000,
        startedAt: "2025-01-01T09:00:00Z",
      }));
    });

    expect(result.current.status).toBe("ready");

    // Stopping state
    act(() => {
      messageHandler(createDefaultStatusMessage({
        status: "stopping",
        uptime: 65000,
        startedAt: "2025-01-01T09:00:00Z",
      }));
    });

    expect(result.current.status).toBe("stopping");
  });

  it("should maintain consistent state structure", async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    act(() => {
      messageHandler(createDefaultStatusMessage());
    });

    expect(result.current).toHaveProperty("status");
    expect(result.current).toHaveProperty("models");
    expect(result.current).toHaveProperty("lastError");
    expect(result.current).toHaveProperty("retries");
    expect(result.current).toHaveProperty("uptime");
    expect(result.current).toHaveProperty("startedAt");
    expect(result.current).toHaveProperty("isLoading");
  });

  it("should handle zero uptime", async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    act(() => {
      messageHandler(createDefaultStatusMessage({
        status: "stopped",
        uptime: 0,
      }));
    });

    expect(result.current.uptime).toBe(0);
  });

  it("should handle large uptime values", async () => {
    const { result } = renderHook(() => useLlamaStatus());

    const messageHandler = websocketServer.on.mock.calls[0][1];

    act(() => {
      messageHandler(createDefaultStatusMessage({
        status: "running",
        uptime: 999999999,
      }));
    });

    expect(result.current.uptime).toBe(999999999);
  });

  it("should handle complex model objects", async () => {
    const { result } = renderHook(() => useLlamaStatus());
    const messageHandler = websocketServer.on.mock.calls[0][1];

    const complexModels = [
      {
        id: "model1",
        name: "Model 1",
        size: "7B",
        quantization: "Q4_K_M",
        memory: "4.2GB",
      },
      {
        id: "model2",
        name: "Model 2",
        size: "13B",
        quantization: "Q4_K_M",
        memory: "7.8GB",
      },
    ];

    act(() => {
      messageHandler(createDefaultStatusMessage({
        status: "running",
        models: complexModels,
        uptime: 1000,
        startedAt: "2025-01-01T00:00:00Z",
      }));
    });

    expect(result.current.models).toEqual(complexModels);
    expect(result.current.models).toHaveLength(2);
  });
});
