import { renderHook } from "@testing-library/react";
import { useFitParams } from "@/hooks/use-fit-params";
import { setupBefore, mockApiResponse } from "./test-utils";

jest.mock("@/hooks/use-websocket", () => ({
  useWebSocket: jest.fn(() => ({
    isConnected: true,
    sendMessage: jest.fn(),
  })),
}));

describe("useFitParams - Initialization", () => {
  beforeEach(() => {
    setupBefore();
  });

  it("should initialize with null fit params", () => {
    fetchMock.mockResolvedValue(mockApiResponse);
    
    const { result } = renderHook(() => useFitParams(123));
    
    expect(result.current.fitParams).toBeNull();
  });

  it("should have loading state initially", () => {
    fetchMock.mockResolvedValue(mockApiResponse);
    
    const { result } = renderHook(() => useFitParams(123));
    
    expect(result.current.loading).toBe(true);
  });

  it("should set loading to false after fetch", async () => {
    fetchMock.mockResolvedValue(mockApiResponse);
    
    const { result, waitForNextUpdate } = renderHook(() => useFitParams(123));
    
    await waitForNextUpdate();
    
    expect(result.current.loading).toBe(false);
  });

  it("should return error null initially", () => {
    fetchMock.mockResolvedValue(mockApiResponse);
    
    const { result } = renderHook(() => useFitParams(123));
    
    expect(result.current.error).toBeNull();
  });
});
