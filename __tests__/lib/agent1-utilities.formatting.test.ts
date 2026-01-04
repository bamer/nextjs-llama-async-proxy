import { captureMetrics } from '@/lib/monitor';

describe('Monitor - Metrics Formatting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should format CPU usage as percentage', () => {
    const metrics = captureMetrics();

    expect(typeof metrics.cpuUsage).toBe('number');
    expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
    expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
  });

  it('should format memory usage as percentage', () => {
    const metrics = captureMetrics();

    expect(typeof metrics.memoryUsage).toBe('number');
    expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
    expect(metrics.memoryUsage).toBeLessThanOrEqual(100);
  });

  it('should format uptime in seconds', () => {
    const metrics = captureMetrics();

    expect(typeof metrics.uptimeSeconds).toBe('number');
    expect(metrics.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('should format timestamp as ISO string', () => {
    const metrics = captureMetrics();

    expect(typeof metrics.timestamp).toBe('string');
    expect(metrics.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
