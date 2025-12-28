import { renderHook, act, waitFor } from '@testing-library/react';
import { useChartHistory } from '@/hooks/useChartHistory';

jest.mock('@/lib/store', () => ({
  useStore: jest.fn(),
}));

const mockSetChartData = jest.fn();

const { useStore } = require('@/lib/store');

describe('useChartHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSetChartData.mockClear();

    useStore.mockImplementation((selector: any) => {
      const state = {
        metrics: null,
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
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should return chart history from store', () => {
    useStore.mockImplementation((selector: (state: any) => any) => {
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
    useStore.mockImplementation((selector: any) => {
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
    expect(callArg.cpu[0].value).toBe(75);
    expect(callArg.memory[0].value).toBe(50);
    expect(callArg.requests[0].value).toBe(100);
  });

  it('should batch all GPU metrics when available', () => {
    useStore.mockImplementation((selector: any) => {
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

  it('should not include gpuUtil when gpuUsage is undefined', () => {
    useStore.mockImplementation((selector: any) => {
      const state = {
        metrics: {
          cpuUsage: 75,
          memoryUsage: 50,
          totalRequests: 100,
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

    const callArg = mockSetChartData.mock.calls[0][0];
    expect(callArg).not.toHaveProperty('gpuUtil');
  });

  it('should not include power when gpuPowerUsage is undefined', () => {
    useStore.mockImplementation((selector: any) => {
      const state = {
        metrics: {
          cpuUsage: 75,
          memoryUsage: 50,
          totalRequests: 100,
          gpuUsage: 80,
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

    const callArg = mockSetChartData.mock.calls[0][0];
    expect(callArg).not.toHaveProperty('power');
  });

  it('should create data points with correct time format', () => {
    useStore.mockImplementation((selector: any) => {
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

    const callArg = mockSetChartData.mock.calls[0][0];
    expect(callArg.cpu[0]).toHaveProperty('time');
    expect(callArg.cpu[0]).toHaveProperty('displayTime');
    expect(callArg.cpu[0]).toHaveProperty('value');
    expect(callArg.cpu[0].time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(callArg.cpu[0].displayTime).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it('should limit chart history to 60 points', () => {
    const existingHistory = {
      cpu: Array.from({ length: 70 }, (_, i) => ({
        time: `2024-01-01T10:00:${String(i).padStart(2, '0')}.000Z`,
        displayTime: `10:00:${String(i).padStart(2, '0')}`,
        value: i,
      })),
      memory: Array.from({ length: 70 }, (_, i) => ({
        time: `2024-01-01T10:00:${String(i).padStart(2, '0')}.000Z`,
        displayTime: `10:00:${String(i).padStart(2, '0')}`,
        value: i * 2,
      })),
      requests: [],
      gpuUtil: [],
      power: [],
    };

    useStore.mockImplementation((selector: any) => {
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

  it('should debounce updates with 5 second interval', () => {
    useStore.mockImplementation((selector: any) => {
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

  it('should handle changing metrics', () => {
    let currentMetrics = {
      cpuUsage: 75,
      memoryUsage: 50,
      totalRequests: 100,
    };

    useStore.mockImplementation((selector: any) => {
      const state = {
        metrics: currentMetrics,
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

    const { rerender } = renderHook(() => useChartHistory());

    const firstCallArg = mockSetChartData.mock.calls[0][0];
    expect(firstCallArg.cpu[0].value).toBe(75);

    currentMetrics = {
      cpuUsage: 80,
      memoryUsage: 60,
      totalRequests: 150,
    };

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(mockSetChartData).toHaveBeenCalledTimes(2);
    const secondCallArg = mockSetChartData.mock.calls[1][0];
    expect(secondCallArg.cpu[secondCallArg.cpu.length - 1].value).toBe(80);
  });

  it('should return correct chart history structure', () => {
    const history = {
      cpu: [
        { time: '2024-01-01T10:00:00.000Z', displayTime: '10:00:00', value: 50 },
      ],
      memory: [],
      requests: [],
      gpuUtil: [],
      power: [],
    };

    useStore.mockImplementation((selector: (state: any) => any) => {
      const state = {
        metrics: null,
        chartHistory: history,
        setChartData: jest.fn(),
      };
      return selector(state);
    });

    const { result } = renderHook(() => useChartHistory());

    expect(result.current).toHaveProperty('cpu');
    expect(result.current).toHaveProperty('memory');
    expect(result.current).toHaveProperty('requests');
    expect(result.current).toHaveProperty('gpuUtil');
    expect(result.current).toHaveProperty('power');
    expect(result.current.cpu).toEqual(history.cpu);
  });

  it('should handle metrics with only CPU data', () => {
    useStore.mockImplementation((selector: any) => {
      const state = {
        metrics: { cpuUsage: 75, memoryUsage: 0, totalRequests: 0 },
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
    expect(callArg.cpu[0].value).toBe(75);
    expect(callArg.memory[0].value).toBe(0);
    expect(callArg.requests[0].value).toBe(0);
  });

  it('should preserve existing chart history when adding new data', () => {
    const existingHistory = {
      cpu: [
        {
          time: '2024-01-01T10:00:00.000Z',
          displayTime: '10:00:00',
          value: 50,
        },
      ],
      memory: [],
      requests: [],
      gpuUtil: [],
      power: [],
    };

    useStore.mockImplementation((selector: any) => {
      const state = {
        metrics: { cpuUsage: 75, memoryUsage: 50, totalRequests: 100 },
        chartHistory: existingHistory,
        setChartData: mockSetChartData,
      };
      return selector(state);
    });

    renderHook(() => useChartHistory());

    const callArg = mockSetChartData.mock.calls[0][0];
    expect(callArg.cpu).toHaveLength(2);
    expect(callArg.cpu[0].value).toBe(50);
    expect(callArg.cpu[1].value).toBe(75);
  });
});
