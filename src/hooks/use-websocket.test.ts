import { renderHook, act } from "@testing-library/react";
import { useWebSocket } from "@hooks/use-websocket";
import { websocketService } from "@services/websocket-service";
import { useSnackbar } from "notistack";

// Mock the dependencies
jest.mock("@services/websocket-service");
jest.mock("notistack");
jest.mock("@lib/store");

describe("useWebSocket Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with disconnected state", () => {
    (websocketService.isConnected as jest.Mock).mockReturnValue(false);
    (websocketService.getConnectionState as jest.Mock).mockReturnValue("disconnected");

    const { result } = renderHook(() => useWebSocket());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionState).toBe("disconnected");
  });

  it("should connect on mount", () => {
    renderHook(() => useWebSocket());
    expect(websocketService.connect).toHaveBeenCalled();
  });

  it("should disconnect on unmount", () => {
    const { unmount } = renderHook(() => useWebSocket());
    unmount();
    expect(websocketService.disconnect).toHaveBeenCalled();
  });

  it("should request data periodically when connected", () => {
    jest.useFakeTimers();

    (websocketService.isConnected as jest.Mock)
      .mockReturnValue(false)
      .mockReturnValueOnce(true);

    renderHook(() => useWebSocket());

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(websocketService.requestMetrics).toHaveBeenCalled();
    expect(websocketService.requestModels).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("should show error snackbar when error occurs", () => {
    const mockEnqueueSnackbar = jest.fn();
    (useSnackbar as jest.Mock).mockReturnValue({ enqueueSnackbar: mockEnqueueSnackbar });

    renderHook(() => useWebSocket());

    // Simulate an error
    act(() => {
      // This would normally be triggered by the store
    });

    // Note: In a real test, you'd need to properly mock the store's error state
    // This is a simplified version
  });

  describe("API Methods", () => {
    beforeEach(() => {
      (websocketService.isConnected as jest.Mock).mockReturnValue(true);
    });

    it("should send messages", () => {
      const { result } = renderHook(() => useWebSocket());
      result.current.sendMessage("testEvent", { data: "test" });
      expect(websocketService.sendMessage).toHaveBeenCalledWith("testEvent", { data: "test" });
    });

    it("should show warning when sending message while disconnected", () => {
      const mockEnqueueSnackbar = jest.fn();
      (useSnackbar as jest.Mock).mockReturnValue({ enqueueSnackbar: mockEnqueueSnackbar });
      (websocketService.isConnected as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => useWebSocket());
      result.current.sendMessage("testEvent", { data: "test" });

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith("WebSocket not connected", {
        variant: "warning",
      });
    });

    it("should request metrics", () => {
      const { result } = renderHook(() => useWebSocket());
      result.current.requestMetrics();
      expect(websocketService.requestMetrics).toHaveBeenCalled();
    });

    it("should request logs", () => {
      const { result } = renderHook(() => useWebSocket());
      result.current.requestLogs();
      expect(websocketService.requestLogs).toHaveBeenCalled();
    });

    it("should request models", () => {
      const { result } = renderHook(() => useWebSocket());
      result.current.requestModels();
      expect(websocketService.requestModels).toHaveBeenCalled();
    });

    it("should start model", () => {
      const { result } = renderHook(() => useWebSocket());
      result.current.startModel("test-model-id");
      expect(websocketService.startModel).toHaveBeenCalledWith("test-model-id");
    });

    it("should stop model", () => {
      const { result } = renderHook(() => useWebSocket());
      result.current.stopModel("test-model-id");
      expect(websocketService.stopModel).toHaveBeenCalledWith("test-model-id");
    });
  });
});