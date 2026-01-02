/**
 * Monitor module main test file
 * Orchestrates test scenarios and exports validation
 */

import monitor, {
  captureMetrics,
  readHistory,
  writeHistory,
} from '@/lib/monitor';
import {
  mockedFs,
  mockedOs,
  setupMonitorMocks,
  cleanupMonitorMocks,
  mockDefaultCpu,
  mockDefaultMemoryAndUptime,
} from './monitor-mock-helpers';

let startPeriodicRecording: any;

describe('monitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMonitorMocks();
    startPeriodicRecording = require('@/lib/monitor').startPeriodicRecording;
  });

  afterEach(() => {
    cleanupMonitorMocks();
  });

  describe('monitor default export', () => {
    it('exports captureMetrics', () => {
      expect(monitor.captureMetrics).toBe(captureMetrics);
    });

    it('exports startPeriodicRecording', () => {
      expect(monitor.startPeriodicRecording).toBe(startPeriodicRecording);
    });

    it('exports readHistory', () => {
      expect(monitor.readHistory).toBe(readHistory);
    });

    it('exports writeHistory', () => {
      expect(monitor.writeHistory).toBe(writeHistory);
    });
  });

  describe('Edge cases', () => {
    it('handles concurrent metrics captures', () => {
      mockDefaultCpu();
      mockDefaultMemoryAndUptime();
      const results = Array.from({ length: 100 }, () => captureMetrics());

      results.forEach((metrics) => {
        expect(metrics).toHaveProperty('cpuUsage');
        expect(metrics).toHaveProperty('memoryUsage');
        expect(metrics).toHaveProperty('uptimeSeconds');
        expect(metrics).toHaveProperty('timestamp');
      });
    });

    it('handles very long uptime', () => {
      mockDefaultCpu();
      mockedOs.totalmem.mockReturnValue(16000000000);
      mockedOs.freemem.mockReturnValue(8000000000);
      mockedOs.uptime.mockReturnValue(999999999);

      const metrics = captureMetrics();

      expect(metrics.uptimeSeconds).toBe(999999999);
    });

    it('handles fractional CPU times', () => {
      mockedOs.cpus.mockReturnValue([
        { model: 'Test CPU', speed: 3000, times: { user: 1000000.5, nice: 0.1, sys: 500000.25, idle: 2000000.75, irq: 0 } },
      ] as any);
      expect(captureMetrics().cpuUsage).toBeDefined();
    });

    it('handles negative uptime', () => {
      mockedOs.totalmem.mockReturnValue(16000000000);
      mockedOs.freemem.mockReturnValue(8000000000);
      mockedOs.uptime.mockReturnValue(-1);
      expect(captureMetrics().uptimeSeconds).toBe(-1);
    });

    it('handles zero total memory', () => {
      mockedOs.totalmem.mockReturnValue(0);
      mockedOs.freemem.mockReturnValue(0);
      expect(captureMetrics().memoryUsage).toBeNaN();
    });

    it('handles history with invalid entries', () => {
      const invalidHistory = [{ cpuUsage: 45, memoryUsage: 60 }, { invalid: 'data' }, null, undefined];
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(invalidHistory));
      expect(readHistory()).toEqual(invalidHistory);
    });
  });

  describe('Performance', () => {
    it('captures metrics quickly', () => {
      mockDefaultCpu();
      mockDefaultMemoryAndUptime();
      const start = Date.now();
      captureMetrics();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('reads history quickly', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('[]');
      const start = Date.now();
      readHistory();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('writes history quickly', () => {
      const mockHistory = Array.from({ length: 1000 }, (_, i) => ({
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        timestamp: new Date(Date.now() - i * 30000).toISOString(),
      }));

      const start = Date.now();
      writeHistory(mockHistory);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Integration', () => {
    it('captures consistent metrics over time', () => {
      mockDefaultCpu();
      mockDefaultMemoryAndUptime();
      const metrics1 = captureMetrics();
      const metrics2 = captureMetrics();

      expect(metrics1).toHaveProperty('cpuUsage');
      expect(metrics2).toHaveProperty('cpuUsage');
      expect(metrics1).toHaveProperty('memoryUsage');
      expect(metrics2).toHaveProperty('memoryUsage');
    });

    it('persists metrics correctly', () => {
      mockDefaultCpu();
      mockDefaultMemoryAndUptime();
      const metrics = captureMetrics();
      const history = [metrics];

      mockedFs.writeFileSync.mockReturnValue(undefined);
      mockedFs.renameSync.mockReturnValue(undefined);

      writeHistory(history);

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(history));

      const readHistoryData = readHistory();

      expect(readHistoryData).toEqual(history);
    });
  });

  describe('Type safety', () => {
    it('returns metrics with correct structure', () => {
      mockDefaultCpu();
      mockDefaultMemoryAndUptime();
      const metrics = captureMetrics();

      expect(metrics).toMatchObject({
        cpuUsage: expect.any(Number),
        memoryUsage: expect.any(Number),
        uptimeSeconds: expect.any(Number),
        timestamp: expect.any(String),
      });
    });

    it('returns history array with correct types', () => {
      const history = readHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });
});
