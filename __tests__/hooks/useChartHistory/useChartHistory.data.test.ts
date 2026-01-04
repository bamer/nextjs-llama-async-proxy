import { renderHook, act } from '@testing-library/react';
import { useChartHistory } from '@/hooks/useChartHistory';
import { createDefaultMockStore, mockSetChartData } from './useChartHistory.test-utils';

jest.mock('@/lib/store', () => ({
  useStore: jest.fn(),
}));

describe('useChartHistory Data Handling', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should return chart history from store', () => {
    const { useStore } = require('@/lib/store');
    useStore.mockImplementation((selector: unknown) => {
      const state = {
        metrics: null,
        chartHistory: {
          cpu: [{ time: '2024-01-01', displayTime: '10:00:00', value: 50 }],
          memory: [],
          requests: [],
          gpuUtil: [],
          power: [],
        },
        setChartData: jest.fn(),
      };
      return selector(state);
    });

    const { result } = renderHook(() => useChartHistory());

    expect(result.current).toEqual({
      cpu: [{ time: '2024-01-01', displayTime: '10:00:00', value: 50 }],
      memory: [],
      requests: [],
      gpuUtil: [],
      power: [],
    });
  });

  it('should not add data when metrics is null', () => {
    createDefaultMockStore();

    const { result } = renderHook(() => useChartHistory());

    expect(result.current).toEqual({
      cpu: [],
      memory: [],
      requests: [],
      gpuUtil: [],
      power: [],
    });

    expect(mockSetChartData).not.toHaveBeenCalled();
  });

  it('should batch all basic chart data in single call', () => {
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
    const callArg = mockSetChartData.mock.calls[0][0];
    expect(callArg).toHaveProperty('cpu');
    expect(callArg).toHaveProperty('memory');
    expect(callArg).toHaveProperty('requests');
    expect(callArg.cpu).toHaveLength(1);
    expect(callArg.memory).toHaveLength(1);
    expect(callArg.requests).toHaveLength(1);
  });

  it('should batch all GPU metrics when available', () => {
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

    renderHook(() => useChartHistory());

    expect(mockSetChartData).toHaveBeenCalledTimes(1);
    const callArg = mockSetChartData.mock.calls[0][0];
    expect(callArg).toHaveProperty('gpuUtil');
    expect(callArg).toHaveProperty('power');
    expect(callArg.gpuUtil).toHaveLength(1);
    expect(callArg.power).toHaveLength(1);
    expect(callArg.gpuUtil[0].value).toBe(85);
    expect(callArg.power[0].value).toBe(250);
  });

  it('should limit chart history to 60 points', () => {
    const existingHistory = {
      cpu: Array.from({ length: 70 }, (_, i) => ({
        time: '2024-01-01T10:00:00.000Z',
        displayTime: `10:00:${String(i).padStart(2, '0')}`,
        value: i,
      })),
      memory: [],
      requests: [],
      gpuUtil: [],
      power: [],
    };

    const { useStore } = require('@/lib/store');
    useStore.mockImplementation((selector: unknown) => {
      const state = {
        metrics: { cpuUsage: 75, memoryUsage: 50, totalRequests: 100 },
        chartHistory: existingHistory,
        setChartData: mockSetChartData,
      };
      return selector(state);
    });

    renderHook(() => useChartHistory());

    const callArg = mockSetChartData.mock.calls[0][0];
    expect(callArg.cpu).toHaveLength(60);
    expect(callArg.memory).toHaveLength(60);
  });
});
