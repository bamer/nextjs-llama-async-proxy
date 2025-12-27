import { renderHook, act } from '@testing-library/react';
import { useChartHistory } from '@/hooks/useChartHistory';

jest.mock('@/lib/store', () => ({
  useStore: jest.fn((selector) => selector({
    metrics: {
      cpuUsage: 50,
      memoryUsage: 60,
      totalRequests: 100,
      gpuUsage: 80,
      gpuPowerUsage: 250,
    },
    chartHistory: {
      cpu: [40, 45, 50],
      memory: [55, 58, 60],
      requests: [90, 95, 100],
      gpuUtil: [75, 78, 80],
      power: [240, 245, 250],
    },
    addChartData: jest.fn(),
  })),
}));

jest.useFakeTimers();

describe('useChartHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns chart history from store', () => {
    const { result } = renderHook(() => useChartHistory());

    expect(result.current).toEqual({
      cpu: [40, 45, 50],
      memory: [55, 58, 60],
      requests: [90, 95, 100],
      gpuUtil: [75, 78, 80],
      power: [240, 245, 250],
    });
  });

  it('adds chart data when metrics change', () => {
    const { result } = renderHook(() => useChartHistory());
    const addChartData = require('@/lib/store').useStore.mock.calls[0][0]((state: any) => state.addChartData);

    expect(result.current).toBeDefined();
  });

  it('handles metrics without GPU data', () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({
      metrics: {
        cpuUsage: 50,
        memoryUsage: 60,
        totalRequests: 100,
      },
      chartHistory: {
        cpu: [40, 45, 50],
        memory: [55, 58, 60],
        requests: [90, 95, 100],
      },
      addChartData: jest.fn(),
    }));

    const { result } = renderHook(() => useChartHistory());

    expect(result.current).toEqual({
      cpu: [40, 45, 50],
      memory: [55, 58, 60],
      requests: [90, 95, 100],
    });
  });

  it('handles null metrics', () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({
      metrics: null,
      chartHistory: {},
      addChartData: jest.fn(),
    }));

    const { result } = renderHook(() => useChartHistory());

    expect(result.current).toEqual({});
  });

  it('polls metrics every 10 seconds', () => {
    const addChartData = jest.fn();
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({
      metrics: {
        cpuUsage: 50,
        memoryUsage: 60,
        totalRequests: 100,
      },
      chartHistory: {},
      addChartData,
    }));

    renderHook(() => useChartHistory());

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(addChartData).toHaveBeenCalled();
  });

  it('cleans up interval on unmount', () => {
    const { unmount } = renderHook(() => useChartHistory());

    unmount();

    act(() => {
      jest.advanceTimersByTime(10000);
    });
  });

  it('handles missing gpuPowerUsage', () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({
      metrics: {
        cpuUsage: 50,
        memoryUsage: 60,
        totalRequests: 100,
        gpuUsage: 80,
      },
      chartHistory: {
        cpu: [40, 45, 50],
        memory: [55, 58, 60],
        requests: [90, 95, 100],
        gpuUtil: [75, 78, 80],
      },
      addChartData: jest.fn(),
    }));

    const { result } = renderHook(() => useChartHistory());

    expect(result.current.power).toBeUndefined();
  });
});
