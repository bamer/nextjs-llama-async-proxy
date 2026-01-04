import { renderHook, act, waitFor } from "@testing-library/react";
import { useFitParams } from "@/hooks/use-fit-params";
import { setupBefore, mockApiResponse, fetchMock } from "./test-utils";

jest.mock("@/hooks/use-websocket", () => ({
  useWebSocket: jest.fn(() => ({
    isConnected: true,
    sendMessage: jest.fn(),
  })),
}));

describe("useFitParams - Refresh", () => {
  beforeEach(() => {
    setupBefore();
  });

  it("should refresh fit params on demand", async () => {
    fetchMock.mockResolvedValue(mockApiResponse);
    
    const { result } = renderHook(() => useFitParams(123));
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    act(() => {
      result.current.refresh();
    });
    
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("should update fit params after refresh", async () => {
    fetchMock.mockResolvedValue(mockApiResponse);
    
    const { result } = renderHook(() => useFitParams(123));
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    const updatedResponse = { ...mockApiResponse, data: { ...mockApiResponse.data, fitParams: { ...mockApiResponse.data.fitParams, id: 2 } } };
    fetchMock.mockResolvedValue(updatedResponse);
    
    act(() => {
      result.current.refresh();
    });
    
    await waitFor(() => expect(result.current.fitParams?.id).toBe(2));
  });

  it("should handle refresh while loading", async () => {
    fetchMock.mockResolvedValue(mockApiResponse);
    
    const { result } = renderHook(() => useFitParams(123));
    
    act(() => {
      result.current.refresh();
    });
    
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
