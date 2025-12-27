import { renderHook, act, waitFor } from '@testing-library/react';
import { useChartHistory } from '@/hooks/useChartHistory';

jest.mock('@/lib/store', () => ({
  useStore: jest.fn(),
}));

const mockSetState = jest.fn();
const mockAddChartData = jest.fn();

const { useStore } = require('@/lib/store');

describe('useChartHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockAddChartData.mockClear();

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
        addChartData: mockAddChartData,
      };
      return selector(state);
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should return chart history from store', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        metrics: null,
        chartHistory: {
          cpu: [{ time: '2024-01-01', displayTime: '10:00:00', value: 50 }],
          memory: [],
          requests: [],
          gpuUtil: [],
          power: [],
        },
        addChartData: jest.fn(),
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

    expect(mockAddChartData).not.toHaveBeenCalled();
  });

  it('should add cpu data when metrics are available', () => {
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
        addChartData: mockAddChartData,
      };
      return selector(state);
    });

    renderHook(() => useChartHistory());

    expect(mockAddChartData).toHaveBeenCalledWith('cpu', 75);
  });

  it('should add memory data when metrics are available', () => {
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
        addChartData: mockAddChartData,
      };
      return selector(state);
    });

    renderHook(() => useChartHistory());

    expect(mockAddChartData).toHaveBeenCalledWith('memory', 50);
  });

  it('should add requests data when metrics are available', () => {
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
        addChartData: mockAddChartData,
      };
      return selector(state);
    });

    renderHook(() => useChartHistory());

    expect(mockAddChartData).toHaveBeenCalledWith('requests', 100);
  });

  it('should add gpuUtil data when gpuUsage is defined', () => {
    useStore.mockImplementation((selector: any) => {
      const state = {
        metrics: {
          cpuUsage: 75,
          memoryUsage: 50,
          totalRequests: 100,
          gpuUsage: 85,
        },
        chartHistory: {
          cpu: [],
          memory: [],
          requests: [],
          gpuUtil: [],
          power: [],
        },
        addChartData: mockAddChartData,
      };
      return selector(state);
    });

    renderHook(() => useChartHistory());

    expect(mockAddChartData).toHaveBeenCalledWith('gpuUtil', 85);
  });

  it('should add power data when gpuPowerUsage is defined', () => {
    useStore.mockImplementation((selector: any) => {
      const state = {
        metrics: {
          cpuUsage: 75,
          memoryUsage: 50,
          totalRequests: 100,
          gpuPowerUsage: 250,
        },
        chartHistory: {
          cpu: [],
          memory: [],
          requests: [],
          gpuUtil: [],
          power: [],
        },
        addChartData: mockAddChartData,
      };
      return selector(state);
    });

    renderHook(() => useChartHistory());

    expect(mockAddChartData).toHaveBeenCalledWith('power', 250);
  });

  it('should not add gpuUtil data when gpuUsage is undefined', () => {
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
        addChartData: mockAddChartData,
      };
      return selector(state);
    });

    renderHook(() => useChartHistory());

    expect(mockAddChartData).not.toHaveBeenCalledWith(
      'gpuUtil',
      expect.anything()
    );
  });

  it('should not add power data when gpuPowerUsage is undefined', () => {
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
        addChartData: mockAddChartData,
      };
      return selector(state);
    });

    renderHook(() => useChartHistory());

    expect(mockAddChartData).not.toHaveBeenCalledWith(
      'power',
      expect.anything()
    );
  });

  it('should add all basic metrics data', () => {
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
        addChartData: mockAddChartData,
      };
      return selector(state);
    });

    renderHook(() => useChartHistory());

    expect(mockAddChartData).toHaveBeenCalledWith('cpu', 75);
    expect(mockAddChartData).toHaveBeenCalledWith('memory', 50);
    expect(mockAddChartData).toHaveBeenCalledWith('requests', 100);
  });

  it('should add all GPU metrics when available', () => {
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
        addChartData: mockAddChartData,
      };
      return selector(state);
    });

    renderHook(() => useChartHistory());

    expect(mockAddChartData).toHaveBeenCalledWith('gpuUtil', 85);
    expect(mockAddChartData).toHaveBeenCalledWith('power', 250);
  });

  it('should set up interval for periodic data updates', () => {
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
        addChartData: mockAddChartData,
      };
      return selector(state);
    });

    renderHook(() => useChartHistory());

    const initialCallCount = mockAddChartData.mock.calls.length;

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockAddChartData.mock.calls.length).toBe(initialCallCount + 3);
  });

  it('should not add data on interval if metrics is null', () => {
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
        addChartData: mockAddChartData,
      };
      return selector(state);
    });

    renderHook(() => useChartHistory());

    expect(mockAddChartData).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockAddChartData).not.toHaveBeenCalled();
  });

  it('should clean up interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

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
        addChartData: mockAddChartData,
      };
      return selector(state);
    });

    const { unmount } = renderHook(() => useChartHistory());

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
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
        addChartData: mockAddChartData,
      };
      return selector(state);
    });

    const { rerender } = renderHook(() => useChartHistory());

    expect(mockAddChartData).toHaveBeenCalledWith('cpu', 75);

    currentMetrics = {
      cpuUsage: 80,
      memoryUsage: 60,
      totalRequests: 150,
    };

    rerender();

    expect(mockAddChartData).toHaveBeenCalledWith('cpu', 80);
  });

  it('should update data every 10 seconds', () => {
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
        addChartData: mockAddChartData,
      };
      return selector(state);
    });

    renderHook(() => useChartHistory());

    const initialCallCount = mockAddChartData.mock.calls.length;

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockAddChartData.mock.calls.length).toBe(initialCallCount + 3);

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockAddChartData.mock.calls.length).toBe(initialCallCount + 6);
  });

  it('should not add data when metrics is empty object', () => {
    useStore.mockImplementation((selector: any) => {
      const state = {
        metrics: {},
        chartHistory: {
          cpu: [],
          memory: [],
          requests: [],
          gpuUtil: [],
          power: [],
        },
        addChartData: mockAddChartData,
      };
      return selector(state);
    });

    renderHook(() => useChartHistory());

    expect(mockAddChartData).toHaveBeenCalledTimes(3);
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

    useStore.mockImplementation((selector) => {
      const state = {
        metrics: null,
        chartHistory: history,
        addChartData: jest.fn(),
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
});
