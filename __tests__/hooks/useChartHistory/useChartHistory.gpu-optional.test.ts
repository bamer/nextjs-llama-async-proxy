import { renderHook } from '@testing-library/react';
import { useChartHistory } from '@/hooks/useChartHistory';
import { mockSetChartData } from './useChartHistory.test-utils';

jest.mock('@/lib/store', () => ({
  useStore: jest.fn(),
}));

describe('useChartHistory GPU Optional Handling', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should handle when gpuUsage is undefined', () => {
    const { useStore } = require('@/lib/store');
    useStore.mockImplementation((selector: unknown) => {
      const state = {
        metrics: {
          cpuUsage: 75,
          memoryUsage: 50,
          totalRequests: 100,
          gpuUsage: undefined,
        },
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

    const { result } = renderHook(() => useChartHistory());

    expect(mockSetChartData).toHaveBeenCalled();
  });

  it('should handle when gpuPowerUsage is undefined', () => {
    const { useStore } = require('@/lib/store');
    useStore.mockImplementation((selector: unknown) => {
      const state = {
        metrics: {
          cpuUsage: 75,
          memoryUsage: 50,
          totalRequests: 100,
          gpuUsage: 80,
          gpuPowerUsage: undefined,
        },
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

    const { result } = renderHook(() => useChartHistory());

    expect(mockSetChartData).toHaveBeenCalled();
  });

  it('should handle when both GPU metrics are defined', () => {
    const { useStore } = require('@/lib/store');
    useStore.mockImplementation((selector: unknown) => {
      const state = {
        metrics: {
          cpuUsage: 75,
          memoryUsage: 50,
          totalRequests: 100,
          gpuUsage: 85,
          gpuPowerUsage: 250,
        },
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

    const { result } = renderHook(() => useChartHistory());

    const callArg = mockSetChartData.mock.calls[0][0];

    expect(callArg.gpuUtil).toHaveLength(1);
    expect(callArg.power).toHaveLength(1);
    expect(callArg.gpuUtil[0].value).toBe(85);
    expect(callArg.power[0].value).toBe(250);
  });
});
