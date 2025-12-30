import * as os from 'os';
import monitor, { captureMetrics } from '@/lib/monitor';

jest.mock('os');
jest.mock('@/lib/logger', () => ({
  getLogger: jest.fn(() => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('monitor - Metrics Collection', () => {
  let mockLogger: jest.Mocked<{ error: jest.Mock; warn: jest.Mock; info: jest.Mock; debug: jest.Mock }>;

  beforeEach(() => {
    jest.clearAllMocks();

    (os.cpus as jest.Mock).mockReturnValue([
      {
        times: { user: 100, sys: 50, idle: 200 },
      },
      {
        times: { user: 120, sys: 60, idle: 180 },
      },
    ]);

    (os.totalmem as jest.Mock).mockReturnValue(8000000000);
    (os.freemem as jest.Mock).mockReturnValue(4000000000);
    (os.uptime as jest.Mock).mockReturnValue(3600);

    // Get mocked logger instance
    mockLogger = require('@/lib/logger').getLogger() as any;
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.info.mockClear();
    mockLogger.debug.mockClear();
  });

  it('should capture CPU usage', () => {
    const metrics = captureMetrics();

    expect(metrics.cpuUsage).toBeDefined();
    expect(typeof metrics.cpuUsage).toBe('number');
    expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
    expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
  });

  it('should capture memory usage', () => {
    const metrics = captureMetrics();

    expect(metrics.memoryUsage).toBeDefined();
    expect(typeof metrics.memoryUsage).toBe('number');
    expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
    expect(metrics.memoryUsage).toBeLessThanOrEqual(100);
  });

  it('should capture uptime seconds', () => {
    const metrics = captureMetrics();

    expect(metrics.uptimeSeconds).toBeDefined();
    expect(typeof metrics.uptimeSeconds).toBe('number');
  });

  it('should include timestamp', () => {
    const metrics = captureMetrics();

    expect(metrics.timestamp).toBeDefined();
    expect(typeof metrics.timestamp).toBe('string');
    expect(new Date(metrics.timestamp)).toBeInstanceOf(Date);
    expect(() => new Date(metrics.timestamp)).not.toThrow();
  });

  it('should calculate CPU usage correctly for multiple cores', () => {
    const metrics = captureMetrics();

    // Formula: (total (user+sys) - avg idle) / total (user+sys) * 100
    // idle = (200 + 180) / 2 = 190
    // total = (100 + 50) + (120 + 60) = 330
    // cpuUsage = ((330 - 190) / 330) * 100 = 42
    const expectedCpu = Math.round(((330 - 190) / 330) * 100);
    expect(metrics.cpuUsage).toBe(expectedCpu);
  });

  it('should calculate memory usage correctly', () => {
    const metrics = captureMetrics();

    const expectedMem = Math.round(
      ((8000000000 - 4000000000) / 8000000000) * 100
    );
    expect(metrics.memoryUsage).toBe(expectedMem);
  });

  describe('CPU calculation edge cases', () => {
    it('should handle zero total time', () => {
      (os.cpus as jest.Mock).mockReturnValue([
        { times: { user: 0, sys: 0, idle: 100 } },
      ]);

      const metrics = captureMetrics();

      expect(metrics.cpuUsage).toBeDefined();
    });

    it('should handle all idle CPU', () => {
      (os.cpus as jest.Mock).mockReturnValue([
        { times: { user: 0, sys: 0, idle: 100 } },
      ]);

      const metrics = captureMetrics();

      expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
    });

    it('should handle all busy CPU', () => {
      (os.cpus as jest.Mock).mockReturnValue([
        { times: { user: 100, sys: 0, idle: 0 } },
      ]);

      const metrics = captureMetrics();

      expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
    });

    it('should handle single CPU core', () => {
      (os.cpus as jest.Mock).mockReturnValue([
        { times: { user: 100, sys: 50, idle: 150 } },
      ]);

      const metrics = monitor.captureMetrics();

      expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
    });

    it('should handle many CPU cores', () => {
      const manyCores = Array(64).fill({ times: { user: 100, sys: 50, idle: 200 } });
      (os.cpus as jest.Mock).mockReturnValue(manyCores);

      const metrics = monitor.captureMetrics();

      expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
    });

    it('should handle CPU with zero total time', () => {
      (os.cpus as jest.Mock).mockReturnValue([
        { times: { user: 0, sys: 0, idle: 0 } },
      ]);

      const metrics = monitor.captureMetrics();

      expect(metrics.cpuUsage).toBeDefined();
    });

    it('should handle CPU with negative time values', () => {
      (os.cpus as jest.Mock).mockReturnValue([
        { times: { user: -100, sys: -50, idle: -150 } },
      ]);

      const metrics = monitor.captureMetrics();

      expect(metrics.cpuUsage).toBeDefined();
    });
  });

  describe('memory calculation edge cases', () => {
    it('should handle zero free memory', () => {
      (os.freemem as jest.Mock).mockReturnValue(0);
      (os.totalmem as jest.Mock).mockReturnValue(8000000000);

      const metrics = captureMetrics();

      expect(metrics.memoryUsage).toBe(100);
    });

    it('should handle all free memory', () => {
      (os.freemem as jest.Mock).mockReturnValue(8000000000);
      (os.totalmem as jest.Mock).mockReturnValue(8000000000);

      const metrics = captureMetrics();

      expect(metrics.memoryUsage).toBe(0);
    });

    it('should handle extremely large memory values', () => {
      (os.freemem as jest.Mock).mockReturnValue(Number.MAX_SAFE_INTEGER);
      (os.totalmem as jest.Mock).mockReturnValue(Number.MAX_SAFE_INTEGER);

      const metrics = captureMetrics();

      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeLessThanOrEqual(100);
    });

    it('should handle zero total memory', () => {
      (os.freemem as jest.Mock).mockReturnValue(0);
      (os.totalmem as jest.Mock).mockReturnValue(0);

      const metrics = captureMetrics();

      expect(metrics.memoryUsage).toBeDefined();
    });

    it('should handle memory equal to total', () => {
      (os.freemem as jest.Mock).mockReturnValue(0);
      (os.totalmem as jest.Mock).mockReturnValue(8000000000);

      const metrics = captureMetrics();

      expect(metrics.memoryUsage).toBe(100);
    });
  });

  describe('uptime edge cases', () => {
    it('should handle negative uptime', () => {
      (os.uptime as jest.Mock).mockReturnValue(-1);

      const metrics = captureMetrics();

      expect(metrics.uptimeSeconds).toBeDefined();
    });

    it('should handle zero uptime', () => {
      (os.uptime as jest.Mock).mockReturnValue(0);

      const metrics = captureMetrics();

      expect(metrics.uptimeSeconds).toBe(0);
    });

    it('should handle very large uptime', () => {
      const largeUptime = Number.MAX_SAFE_INTEGER;
      (os.uptime as jest.Mock).mockReturnValue(largeUptime);

      const metrics = captureMetrics();

      expect(metrics.uptimeSeconds).toBe(Math.round(largeUptime));
    });

    it('should format uptime as integer seconds', () => {
      (os.uptime as jest.Mock).mockReturnValue(1234.567);

      const metrics = captureMetrics();

      expect(metrics.uptimeSeconds).toBe(1235);
    });
  });

  describe('timestamp handling', () => {
    it('should handle timestamp in metrics', () => {
      const metrics = monitor.captureMetrics();

      expect(metrics.timestamp).toBeDefined();
      expect(typeof metrics.timestamp).toBe('string');
      const date = new Date(metrics.timestamp);
      expect(date.toISOString()).toBe(metrics.timestamp);
    });

    it('should handle invalid Date parsing in timestamp', () => {
      const metrics = captureMetrics();

      expect(metrics.timestamp).toBeDefined();
      const date = new Date(metrics.timestamp);
      expect(date.getTime()).not.toBeNaN();
    });

    it('should format timestamp as ISO string', () => {
      const metrics = captureMetrics();

      expect(metrics.timestamp).toBeDefined();
      const date = new Date(metrics.timestamp);
      expect(date.getTime()).not.toBeNaN();
    });
  });

  describe('additional edge cases', () => {
    it('should handle empty CPU array', () => {
      (os.cpus as jest.Mock).mockReturnValue([]);

      const metrics = captureMetrics();

      expect(metrics).toBeDefined();
    });

    it('should handle zero total CPU time', () => {
      (os.cpus as jest.Mock).mockReturnValue([
        { times: { user: 0, sys: 0, idle: 0 } },
      ]);

      const metrics = captureMetrics();

      expect(metrics.cpuUsage).toBeDefined();
    });

    it('should handle division by zero in CPU calculation', () => {
      (os.cpus as jest.Mock).mockReturnValue([
        { times: { user: 0, sys: 0, idle: 0 } },
      ]);

      const metrics = captureMetrics();

      expect(metrics.cpuUsage).toBeDefined();
    });

    it('should handle missing CPU properties', () => {
      (os.cpus as jest.Mock).mockReturnValue([
        { times: {} as any },
      ]);

      const metrics = captureMetrics();

      expect(metrics).toBeDefined();
    });
  });
});
