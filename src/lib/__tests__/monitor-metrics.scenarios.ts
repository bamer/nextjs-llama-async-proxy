/**
 * Test scenarios for captureMetrics functionality
 * Focuses on CPU, memory, uptime, and timestamp metrics capture
 */

import { captureMetrics } from '@/lib/monitor';
import {
  mockedOs,
  mockDefaultCpu,
  mockDefaultMemoryAndUptime,
  createMockCpuCore,
  createMultipleMockCpuCores,
} from './monitor-mock-helpers';

describe('captureMetrics', () => {
  const setupDefaults = () => {
    mockDefaultCpu();
    mockDefaultMemoryAndUptime();
  };

  it('captures CPU usage', () => {
    setupDefaults();
    const metrics = captureMetrics();
    expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
    expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
  });

  it('captures memory usage', () => {
    setupDefaults();
    const metrics = captureMetrics();
    expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
    expect(metrics.memoryUsage).toBeLessThanOrEqual(100);
  });

  it('captures uptime', () => {
    setupDefaults();
    const metrics = captureMetrics();
    expect(metrics.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('captures timestamp in ISO format', () => {
    setupDefaults();
    const metrics = captureMetrics();
    expect(metrics.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('calculates metrics correctly', () => {
    setupDefaults();
    const metrics = captureMetrics();
    expect(metrics.cpuUsage).toBeGreaterThan(0);
    expect(metrics.cpuUsage).toBeLessThan(100);
    expect(metrics.memoryUsage).toBe(50);
    expect(metrics.uptimeSeconds).toBe(3600);
  });

  it('handles single CPU core', () => {
    mockedOs.cpus.mockReturnValue([createMockCpuCore()] as any);
    const metrics = captureMetrics();
    expect(metrics.cpuUsage).toBeDefined();
  });

  it('handles multiple CPU cores', () => {
    mockedOs.cpus.mockReturnValue(createMultipleMockCpuCores(8) as any);
    const metrics = captureMetrics();
    expect(metrics.cpuUsage).toBeDefined();
  });

  it('handles zero idle time', () => {
    mockedOs.cpus.mockReturnValue([createMockCpuCore(1000000, 500000, 0)] as any);
    expect(captureMetrics().cpuUsage).toBe(100);
  });

  it('handles all idle time', () => {
    mockedOs.cpus.mockReturnValue([createMockCpuCore(0, 0, 1000000)] as any);
    expect(captureMetrics().cpuUsage).toBe(0);
  });

  it('handles zero and full memory usage', () => {
    mockedOs.totalmem.mockReturnValue(16000000000);
    mockedOs.freemem.mockReturnValue(16000000000);
    expect(captureMetrics().memoryUsage).toBe(0);
    mockedOs.freemem.mockReturnValue(0);
    expect(captureMetrics().memoryUsage).toBe(100);
  });

  it('handles zero uptime', () => {
    mockedOs.uptime.mockReturnValue(0);
    expect(captureMetrics().uptimeSeconds).toBe(0);
  });

  it('handles fractional CPU times', () => {
    mockedOs.cpus.mockReturnValue([
      { model: 'Test CPU', speed: 3000, times: { user: 1000000.5, nice: 0.1, sys: 500000.25, idle: 2000000.75, irq: 0 } },
    ] as any);
    expect(captureMetrics().cpuUsage).toBeDefined();
  });

  it('handles negative uptime', () => {
    mockedOs.uptime.mockReturnValue(-1);
    expect(captureMetrics().uptimeSeconds).toBe(-1);
  });

  it('handles zero total memory', () => {
    mockedOs.totalmem.mockReturnValue(0);
    mockedOs.freemem.mockReturnValue(0);
    expect(captureMetrics().memoryUsage).toBeNaN();
  });
});
