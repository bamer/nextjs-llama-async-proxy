/**
 * Mock data for useSystemMetrics edge case tests
 */

export const mockNullResponseData = null;

export const mockUndefinedResponseData = undefined;

export const mockNullMetricValues = {
  cpuUsage: null,
  memoryUsage: null,
  memoryUsed: null,
  memoryTotal: null,
  uptime: null,
  cpuCores: null,
  timestamp: null,
};

export const mockUndefinedMetricValues = {
  cpuUsage: undefined,
  memoryUsage: undefined,
  memoryUsed: undefined,
  memoryTotal: undefined,
  uptime: undefined,
  cpuCores: undefined,
  timestamp: undefined,
};

export const mockNullLoadAverage = {
  cpuUsage: 50,
  memoryUsage: 60,
  memoryUsed: 8,
  memoryTotal: 16,
  uptime: 100,
  cpuCores: 8,
  loadAverage: null,
  timestamp: 123456,
};

export const mockUndefinedLoadAverage = {
  cpuUsage: 50,
  memoryUsage: 60,
  memoryUsed: 8,
  memoryTotal: 16,
  uptime: 100,
  cpuCores: 8,
  loadAverage: undefined,
  timestamp: 123456,
};

export const mockZeroMetricValues = {
  cpuUsage: 0,
  memoryUsage: 0,
  memoryUsed: 0,
  memoryTotal: 0,
  uptime: 0,
  cpuCores: 0,
  timestamp: 0,
};

export const mockNegativeMetricValues = {
  cpuUsage: -10,
  memoryUsage: -20,
  memoryUsed: -5,
  memoryTotal: -10,
  uptime: -100,
  cpuCores: -2,
  timestamp: -1000,
};

export const mockLargeMetricValues = {
  cpuUsage: Number.MAX_SAFE_INTEGER,
  memoryUsage: Number.MAX_SAFE_INTEGER,
  memoryUsed: Number.MAX_SAFE_INTEGER,
  memoryTotal: Number.MAX_SAFE_INTEGER,
  uptime: Number.MAX_SAFE_INTEGER,
  cpuCores: Number.MAX_SAFE_INTEGER,
  timestamp: Number.MAX_SAFE_INTEGER,
};

export const mockDecimalMetricValues = {
  cpuUsage: 50.5,
  memoryUsage: 60.7,
  memoryUsed: 8.3,
  memoryTotal: 16.9,
  uptime: 100.2,
  cpuCores: 8,
  timestamp: 123456.789,
};

export const mockLoadAverageArray = {
  cpuUsage: 50,
  memoryUsage: 60,
  memoryUsed: 8,
  memoryTotal: 16,
  uptime: 100,
  cpuCores: 8,
  loadAverage: [0.5, 1.0, 1.5],
  timestamp: 123456,
};

export const mockEmptyLoadAverageArray = {
  cpuUsage: 50,
  memoryUsage: 60,
  memoryUsed: 8,
  memoryTotal: 16,
  uptime: 100,
  cpuCores: 8,
  loadAverage: [],
  timestamp: 123456,
};

export const mockLargeLoadAverageArray = {
  cpuUsage: 50,
  memoryUsage: 60,
  memoryUsed: 8,
  memoryTotal: 16,
  uptime: 100,
  cpuCores: 8,
  loadAverage: Array.from({ length: 1000 }, () => Math.random()),
  timestamp: 123456,
};

export const mockNanMetricValues = {
  cpuUsage: NaN,
  memoryUsage: NaN,
  memoryUsed: NaN,
  memoryTotal: NaN,
  uptime: NaN,
  cpuCores: NaN,
  timestamp: NaN,
};

export const mockInfinityMetricValues = {
  cpuUsage: Infinity,
  memoryUsage: Infinity,
  memoryUsed: Infinity,
  memoryTotal: Infinity,
  uptime: Infinity,
  cpuCores: Infinity,
  timestamp: Infinity,
};

export const mockStringNumbersMetrics = {
  cpuUsage: '50',
  memoryUsage: '60',
  memoryUsed: '8',
  memoryTotal: '16',
  uptime: '100',
  cpuCores: '8',
  timestamp: '123456',
} as any;

export const mockPartialMetrics = {
  cpuUsage: 50,
};

export const mockExtraFieldsMetrics = {
  cpuUsage: 50,
  memoryUsage: 60,
  memoryUsed: 8,
  memoryTotal: 16,
  uptime: 100,
  cpuCores: 8,
  timestamp: 123456,
  extraField: 'extra',
  anotherExtra: 123,
};

export const createLargeResponseData = (size: number) => {
  return Array.from({ length: size }, (_, i) => ({
    cpuUsage: i % 100,
    memoryUsage: i % 100,
  }));
};
