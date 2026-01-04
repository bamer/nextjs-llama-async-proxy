import { renderHook, act } from '@testing-library/react';
import { useChartHistory } from '@/hooks/useChartHistory';
import { createDefaultMockStore, mockSetChartData } from './useChartHistory.test-utils';

jest.mock('@/lib/store', () => ({
  useStore: jest.fn(),
}));

describe('useChartHistory Debounce Behavior', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should debounce updates with 5 second interval', () => {
    const { useStore } = require('@/lib/store');
    useStore.mockImplementation((selector: unknown) => {
      const state = {
        metrics: { cpuUsage: 75, memoryUsage: 50, totalRequests: 100 },
        chartHistory: {
          cpu: [],
          memory: [],
          requests: [],
          gpuUtil: [],
          power: [],
        },
        setChartData: mockSetChartData,
      };
      return selector(state);
    });

    renderHook(() => useChartHistory());

    expect(mockSetChartData).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(mockSetChartData).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockSetChartData).toHaveBeenCalledTimes(2);
  });

  it('should skip updates when less than 5 seconds have passed', () => {
    createDefaultMockStore();

    renderHook(() => useChartHistory());

    expect(mockSetChartData).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(3000); // Less than 5000ms
    });

    expect(mockSetChartData).toHaveBeenCalledTimes(1);
  });

  it('should trigger updates when exactly 5 seconds have passed', () => {
    const { useStore } = require('@/lib/store');
    useStore.mockImplementation((selector: unknown) => {
      const state = {
        metrics: { cpuUsage: 80, memoryUsage: 60, totalRequests: 150 },
        chartHistory: {
          cpu: [],
          memory: [],
          requests: [],
          gpuUtil: [],
          power: [],
        },
        setChartData: mockSetChartData,
      };
      return selector(state);
    });

    renderHook(() => useChartHistory());

    expect(mockSetChartData).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(5000); // Exactly 5000ms
    });

    expect(mockSetChartData).toHaveBeenCalledTimes(2);
  });
});
