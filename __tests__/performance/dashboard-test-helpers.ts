/**
 * Shared test helpers and mocks for dashboard performance tests
 */

import { render, fireEvent, act, screen } from '@testing-library/react';
import type { LegacySystemMetrics, ModelConfig } from '@/types';
import { useStore } from '@/lib/store';

/**
 * Helper function to create mock metrics (LegacySystemMetrics format)
 */
export const createMockMetrics = (overrides: Partial<LegacySystemMetrics> = {}): LegacySystemMetrics => ({
  cpuUsage: 45,
  memoryUsage: 55,
  diskUsage: 60,
  activeModels: 2,
  totalRequests: 1000,
  avgResponseTime: 150,
  uptime: 86400,
  timestamp: new Date().toISOString(),
  ...overrides,
});

/**
 * Common beforeEach setup for dashboard tests
 */
export const setupDashboardTest = () => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  useStore.getState().setMetrics(createMockMetrics() as never);
  useStore.getState().setModels([]);
  useStore.getState().clearChartData();
};

/**
 * Common afterEach cleanup for dashboard tests
 */
export const cleanupDashboardTest = () => {
  jest.useRealTimers();
};

/**
 * Re-export test library functions for convenience
 */
export { render, fireEvent, act, screen };
