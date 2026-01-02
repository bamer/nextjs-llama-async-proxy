/**
 * Mock helpers for monitor tests
 * Provides reusable mock setup and utilities for monitor functionality tests
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

jest.mock('fs');
jest.mock('os');
jest.mock('path');

export const mockedFs = fs as jest.Mocked<typeof fs>;
export const mockedOs = os as jest.Mocked<typeof os>;
export const mockedPath = path as jest.Mocked<typeof path>;

// Store original setInterval to restore it
const originalSetInterval = global.setInterval;

/**
 * Setup common mocks before each test
 */
export function setupMonitorMocks(): void {
  jest.useFakeTimers();
  mockedPath.join.mockReturnValue('/mock/path/monitoring-history.json');
  mockedPath.join.mockImplementation((...args) => args.join('/'));
  // Clear any existing intervals
  global.setInterval = jest.fn() as any;
}

/**
 * Cleanup mocks after each test
 */
export function cleanupMonitorMocks(): void {
  jest.useRealTimers();
  jest.clearAllTimers();
  global.setInterval = originalSetInterval;
}

/**
 * Mock default CPU data with 2 cores
 */
export function mockDefaultCpu(): void {
  mockedOs.cpus.mockReturnValue([
    {
      model: 'Intel(R) Core(TM) i7-9700K',
      speed: 3600,
      times: {
        user: 1000000,
        nice: 0,
        sys: 500000,
        idle: 2000000,
        irq: 0,
      },
    },
    {
      model: 'Intel(R) Core(TM) i7-9700K',
      speed: 3600,
      times: {
        user: 1200000,
        nice: 0,
        sys: 600000,
        idle: 1800000,
        irq: 0,
      },
    },
  ] as any);
}

/**
 * Mock default memory and uptime
 */
export function mockDefaultMemoryAndUptime(): void {
  mockedOs.totalmem.mockReturnValue(16000000000);
  mockedOs.freemem.mockReturnValue(8000000000);
  mockedOs.uptime.mockReturnValue(3600);
}

/**
 * Create mock history data
 */
export function createMockHistory(count: number = 2): Array<{
  cpuUsage: number;
  memoryUsage: number;
  timestamp: string;
}> {
  return Array.from({ length: count }, (_, i) => ({
    cpuUsage: Math.random() * 100,
    memoryUsage: Math.random() * 100,
    timestamp: new Date(Date.now() - i * 30000).toISOString(),
  }));
}

/**
 * Create large mock history for performance tests
 */
export function createLargeMockHistory(count: number = 10000): Array<{
  cpuUsage: number;
  memoryUsage: number;
  timestamp: string;
}> {
  return createMockHistory(count);
}

/**
 * Setup file system mocks for history operations
 */
export function setupFsMocks(
  exists: boolean,
  data?: unknown
): void {
  mockedFs.existsSync.mockReturnValue(exists);
  if (data !== undefined) {
    mockedFs.readFileSync.mockReturnValue(
      typeof data === 'string' ? data : JSON.stringify(data)
    );
  }
  mockedFs.writeFileSync.mockReturnValue(undefined);
  mockedFs.renameSync.mockReturnValue(undefined);
}

/**
 * Create mock CPU core data
 */
export function createMockCpuCore(
  user?: number,
  sys?: number,
  idle?: number
): any {
  return {
    model: 'Test CPU',
    speed: 3000,
    times: {
      user: user ?? 1000000,
      nice: 0,
      sys: sys ?? 500000,
      idle: idle ?? 2000000,
      irq: 0,
    },
  };
}

/**
 * Create multiple mock CPU cores
 */
export function createMultipleMockCpuCores(count: number): any[] {
  return Array.from({ length: count }, () => createMockCpuCore());
}
