import { renderHook } from '@testing-library/react';

export const mockSetChartData = jest.fn();

export const createDefaultMockStore = () => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockSetChartData.mockClear();

  const { useStore } = require('@/lib/store');
  useStore.mockImplementation((selector: unknown) => {
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
};

export const createMetricsMockStore = (metrics: unknown) => {
  const { useStore } = require('@/lib/store');
  useStore.mockImplementation((selector: unknown) => {
    const state = {
      metrics,
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
};
