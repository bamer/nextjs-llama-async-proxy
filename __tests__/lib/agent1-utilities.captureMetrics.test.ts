import { captureMetrics } from '@/lib/monitor';
import os from 'os';

describe('Monitor - captureMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return metrics object with all required fields', () => {
    const metrics = captureMetrics();

    expect(metrics).toHaveProperty('cpuUsage');
    expect(metrics).toHaveProperty('memoryUsage');
    expect(metrics).toHaveProperty('uptimeSeconds');
    expect(metrics).toHaveProperty('timestamp');
  });

  it('should return CPU usage between 0 and 100', () => {
    const metrics = captureMetrics();

    expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
    expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
    expect(typeof metrics.cpuUsage).toBe('number');
  });

  it('should return memory usage between 0 and 100', () => {
    const metrics = captureMetrics();

    expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
    expect(metrics.memoryUsage).toBeLessThanOrEqual(100);
    expect(typeof metrics.memoryUsage).toBe('number');
  });

  it('should return uptime in seconds', () => {
    const metrics = captureMetrics();

    expect(typeof metrics.uptimeSeconds).toBe('number');
    expect(metrics.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('should return ISO timestamp', () => {
    const metrics = captureMetrics();

    expect(typeof metrics.timestamp).toBe('string');
    expect(metrics.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should calculate based on os.cpus() and os.totalmem()', () => {
    const cpuSpy = jest.spyOn(os, 'cpus');
    const memSpy = jest.spyOn(os, 'totalmem');

    captureMetrics();

    expect(cpuSpy).toHaveBeenCalled();
    expect(memSpy).toHaveBeenCalled();

    cpuSpy.mockRestore();
    memSpy.mockRestore();
  });

  it('should use os.freemem for memory calculation', () => {
    const freeSpy = jest.spyOn(os, 'freemem');

    captureMetrics();

    expect(freeSpy).toHaveBeenCalled();

    freeSpy.mockRestore();
  });

  it('should use os.uptime for uptime seconds', () => {
    const uptimeSpy = jest.spyOn(os, 'uptime');

    captureMetrics();

    expect(uptimeSpy).toHaveBeenCalled();

    uptimeSpy.mockRestore();
  });
});
