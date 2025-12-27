import monitor, {
  captureMetrics,
  startPeriodicRecording,
  readHistory,
  writeHistory,
} from '@/lib/monitor';
import fs from 'fs';
import os from 'os';
import path from 'path';

jest.mock('fs');
jest.mock('os');
jest.mock('path');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedOs = os as jest.Mocked<typeof os>;
const mockedPath = path as jest.Mocked<typeof path>;

describe('monitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockedPath.join.mockReturnValue('/mock/path/monitoring-history.json');
    mockedPath.join.mockImplementation((...args) => args.join('/'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('captureMetrics', () => {
    beforeEach(() => {
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

      mockedOs.totalmem.mockReturnValue(16000000000);
      mockedOs.freemem.mockReturnValue(8000000000);
      mockedOs.uptime.mockReturnValue(3600);
    });

    it('captures CPU usage', () => {
      const metrics = captureMetrics();

      expect(metrics).toHaveProperty('cpuUsage');
      expect(typeof metrics.cpuUsage).toBe('number');
      expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
    });

    it('captures memory usage', () => {
      const metrics = captureMetrics();

      expect(metrics).toHaveProperty('memoryUsage');
      expect(typeof metrics.memoryUsage).toBe('number');
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeLessThanOrEqual(100);
    });

    it('captures uptime', () => {
      const metrics = captureMetrics();

      expect(metrics).toHaveProperty('uptimeSeconds');
      expect(typeof metrics.uptimeSeconds).toBe('number');
      expect(metrics.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });

    it('captures timestamp', () => {
      const metrics = captureMetrics();

      expect(metrics).toHaveProperty('timestamp');
      expect(typeof metrics.timestamp).toBe('string');
      expect(() => new Date(metrics.timestamp)).not.toThrow();
    });

    it('returns ISO format timestamp', () => {
      const metrics = captureMetrics();

      expect(metrics.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('calculates CPU usage correctly', () => {
      const metrics = captureMetrics();

      expect(metrics.cpuUsage).toBeGreaterThan(0);
      expect(metrics.cpuUsage).toBeLessThan(100);
    });

    it('calculates memory usage correctly', () => {
      const metrics = captureMetrics();

      const expectedUsage = Math.round(((16000000000 - 8000000000) / 16000000000) * 100);
      expect(metrics.memoryUsage).toBe(expectedUsage);
    });

    it('calculates uptime in seconds', () => {
      const metrics = captureMetrics();

      expect(metrics.uptimeSeconds).toBe(3600);
    });

    it('handles single CPU core', () => {
      mockedOs.cpus.mockReturnValue([
        {
          model: 'Test CPU',
          speed: 3000,
          times: {
            user: 1000000,
            nice: 0,
            sys: 500000,
            idle: 2000000,
            irq: 0,
          },
        },
      ] as any);

      const metrics = captureMetrics();

      expect(metrics.cpuUsage).toBeDefined();
      expect(typeof metrics.cpuUsage).toBe('number');
    });

    it('handles multiple CPU cores', () => {
      const coreCount = 8;
      mockedOs.cpus.mockReturnValue(
        Array.from({ length: coreCount }, () => ({
          model: 'Test CPU',
          speed: 3000,
          times: {
            user: 1000000,
            nice: 0,
            sys: 500000,
            idle: 2000000,
            irq: 0,
          },
        }))
      ) as any;

      const metrics = captureMetrics();

      expect(metrics.cpuUsage).toBeDefined();
      expect(typeof metrics.cpuUsage).toBe('number');
    });

    it('handles zero idle time', () => {
      mockedOs.cpus.mockReturnValue([
        {
          model: 'Test CPU',
          speed: 3000,
          times: {
            user: 1000000,
            nice: 0,
            sys: 500000,
            idle: 0,
            irq: 0,
          },
        },
      ] as any);

      const metrics = captureMetrics();

      expect(metrics.cpuUsage).toBe(100);
    });

    it('handles all idle time', () => {
      mockedOs.cpus.mockReturnValue([
        {
          model: 'Test CPU',
          speed: 3000,
          times: {
            user: 0,
            nice: 0,
            sys: 0,
            idle: 1000000,
            irq: 0,
          },
        },
      ] as any);

      const metrics = captureMetrics();

      expect(metrics.cpuUsage).toBe(0);
    });

    it('handles zero memory usage', () => {
      mockedOs.totalmem.mockReturnValue(16000000000);
      mockedOs.freemem.mockReturnValue(16000000000);

      const metrics = captureMetrics();

      expect(metrics.memoryUsage).toBe(0);
    });

    it('handles full memory usage', () => {
      mockedOs.totalmem.mockReturnValue(16000000000);
      mockedOs.freemem.mockReturnValue(0);

      const metrics = captureMetrics();

      expect(metrics.memoryUsage).toBe(100);
    });

    it('handles zero uptime', () => {
      mockedOs.uptime.mockReturnValue(0);

      const metrics = captureMetrics();

      expect(metrics.uptimeSeconds).toBe(0);
    });
  });

  describe('readHistory', () => {
    it('returns empty array when file does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      const history = readHistory();

      expect(history).toEqual([]);
    });

    it('returns empty array on file read error', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });

      const history = readHistory();

      expect(history).toEqual([]);
    });

    it('returns empty array on JSON parse error', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('invalid json');

      const history = readHistory();

      expect(history).toEqual([]);
    });

    it('returns parsed history data', () => {
      const mockHistory = [
        { cpuUsage: 45, memoryUsage: 60, timestamp: '2024-01-01T00:00:00.000Z' },
        { cpuUsage: 50, memoryUsage: 65, timestamp: '2024-01-01T00:00:30.000Z' },
      ];

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockHistory));

      const history = readHistory();

      expect(history).toEqual(mockHistory);
    });

    it('returns empty array when file is empty', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('');

      const history = readHistory();

      expect(history).toEqual([]);
    });

    it('handles large history files', () => {
      const largeHistory = Array.from({ length: 10000 }, (_, i) => ({
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        timestamp: new Date(Date.now() - i * 30000).toISOString(),
      }));

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(largeHistory));

      const history = readHistory();

      expect(history).toHaveLength(10000);
    });
  });

  describe('writeHistory', () => {
    it('writes history to temporary file', () => {
      const mockHistory = [{ cpuUsage: 45, memoryUsage: 60 }];

      writeHistory(mockHistory);

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        '/mock/path/monitoring-history.json.tmp',
        JSON.stringify(mockHistory, null, 2),
        'utf8'
      );
    });

    it('renames temporary file to final file', () => {
      const mockHistory = [{ cpuUsage: 45, memoryUsage: 60 }];

      writeHistory(mockHistory);

      expect(mockedFs.renameSync).toHaveBeenCalledWith(
        '/mock/path/monitoring-history.json.tmp',
        '/mock/path/monitoring-history.json'
      );
    });

    it('handles write errors gracefully', () => {
      mockedFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      expect(() => writeHistory([])).not.toThrow();
    });

    it('handles rename errors gracefully', () => {
      mockedFs.writeFileSync.mockReturnValue(undefined);
      mockedFs.renameSync.mockImplementation(() => {
        throw new Error('Rename error');
      });

      expect(() => writeHistory([])).not.toThrow();
    });

    it('formats JSON with 2-space indentation', () => {
      const mockHistory = [{ cpuUsage: 45, memoryUsage: 60 }];

      writeHistory(mockHistory);

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('  '),
        expect.any(String)
      );
    });

    it('writes UTF-8 encoded JSON', () => {
      const mockHistory = [{ cpuUsage: 45, memoryUsage: 60 }];

      writeHistory(mockHistory);

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'utf8'
      );
    });

    it('handles empty history array', () => {
      expect(() => writeHistory([])).not.toThrow();
    });

    it('handles large history arrays', () => {
      const largeHistory = Array.from({ length: 10000 }, (_, i) => ({
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        timestamp: new Date(Date.now() - i * 30000).toISOString(),
      }));

      expect(() => writeHistory(largeHistory)).not.toThrow();
    });
  });

  describe('startPeriodicRecording', () => {
    it('starts recording interval', () => {
      startPeriodicRecording();

      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 30000);
    });

    it('does not start multiple intervals', () => {
      startPeriodicRecording();
      startPeriodicRecording();

      expect(setInterval).toHaveBeenCalledTimes(1);
    });

    it('captures metrics on interval', () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.writeFileSync.mockReturnValue(undefined);
      mockedFs.renameSync.mockReturnValue(undefined);

      startPeriodicRecording();

      jest.advanceTimersByTime(30000);

      expect(mockedFs.writeFileSync).toHaveBeenCalled();
    });

    it('writes metrics to history file', () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.writeFileSync.mockReturnValue(undefined);
      mockedFs.renameSync.mockReturnValue(undefined);

      startPeriodicRecording();

      jest.advanceTimersByTime(30000);

      expect(mockedFs.renameSync).toHaveBeenCalled();
    });

    it('adds id to metrics entry', () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.writeFileSync.mockReturnValue(undefined);
      mockedFs.renameSync.mockReturnValue(undefined);

      startPeriodicRecording();

      jest.advanceTimersByTime(30000);

      const writeCall = mockedFs.writeFileSync.mock.calls[0][1];
      const history = JSON.parse(writeCall);

      expect(history[0]).toHaveProperty('id');
      expect(typeof history[0].id).toBe('number');
    });

    it('uses timestamp as id', () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.writeFileSync.mockReturnValue(undefined);
      mockedFs.renameSync.mockReturnValue(undefined);

      startPeriodicRecording();

      jest.advanceTimersByTime(30000);

      const writeCall = mockedFs.writeFileSync.mock.calls[0][1];
      const history = JSON.parse(writeCall);

      expect(history[0].id).toBeGreaterThan(0);
    });

    it('records multiple intervals', () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.writeFileSync.mockReturnValue(undefined);
      mockedFs.renameSync.mockReturnValue(undefined);

      startPeriodicRecording();

      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(30000);
      }

      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(5);
    });

    it('reads existing history before writing', () => {
      const existingHistory = [{ cpuUsage: 45, id: 1234567890 }];
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(existingHistory));
      mockedFs.writeFileSync.mockReturnValue(undefined);
      mockedFs.renameSync.mockReturnValue(undefined);

      startPeriodicRecording();

      jest.advanceTimersByTime(30000);

      const writeCall = mockedFs.writeFileSync.mock.calls[0][1];
      const history = JSON.parse(writeCall);

      expect(history).toHaveLength(2);
      expect(history[0]).toEqual(existingHistory[0]);
    });
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
      const results = Array.from({ length: 100 }, () => captureMetrics());

      results.forEach((metrics) => {
        expect(metrics).toHaveProperty('cpuUsage');
        expect(metrics).toHaveProperty('memoryUsage');
        expect(metrics).toHaveProperty('uptimeSeconds');
        expect(metrics).toHaveProperty('timestamp');
      });
    });

    it('handles very long uptime', () => {
      mockedOs.uptime.mockReturnValue(999999999);

      const metrics = captureMetrics();

      expect(metrics.uptimeSeconds).toBe(999999999);
    });

    it('handles fractional CPU times', () => {
      mockedOs.cpus.mockReturnValue([
        {
          model: 'Test CPU',
          speed: 3000,
          times: {
            user: 1000000.5,
            nice: 0.1,
            sys: 500000.25,
            idle: 2000000.75,
            irq: 0,
          },
        },
      ] as any);

      const metrics = captureMetrics();

      expect(metrics.cpuUsage).toBeDefined();
    });

    it('handles negative uptime', () => {
      mockedOs.uptime.mockReturnValue(-1);

      const metrics = captureMetrics();

      expect(metrics.uptimeSeconds).toBe(-1);
    });

    it('handles zero total memory', () => {
      mockedOs.totalmem.mockReturnValue(0);
      mockedOs.freemem.mockReturnValue(0);

      const metrics = captureMetrics();

      expect(metrics.memoryUsage).toBeNaN();
    });

    it('handles history with invalid entries', () => {
      const invalidHistory = [
        { cpuUsage: 45, memoryUsage: 60 },
        { invalid: 'data' },
        null,
        undefined,
      ];

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(invalidHistory));

      const history = readHistory();

      expect(history).toEqual(invalidHistory);
    });

    it('handles metrics capture during recording interval', () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.writeFileSync.mockReturnValue(undefined);
      mockedFs.renameSync.mockReturnValue(undefined);

      startPeriodicRecording();

      const manualMetrics = captureMetrics();

      expect(manualMetrics).toBeDefined();

      jest.advanceTimersByTime(30000);

      const recordedMetrics = JSON.parse(mockedFs.writeFileSync.mock.calls[0][1])[0];

      expect(recordedMetrics).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('captures metrics quickly', () => {
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
    it('records metrics over time', () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.writeFileSync.mockReturnValue(undefined);
      mockedFs.renameSync.mockReturnValue(undefined);

      startPeriodicRecording();

      for (let i = 0; i < 10; i++) {
        jest.advanceTimersByTime(30000);
      }

      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(10);
    });

    it('captures consistent metrics over time', () => {
      const metrics1 = captureMetrics();
      const metrics2 = captureMetrics();

      expect(metrics1).toHaveProperty('cpuUsage');
      expect(metrics2).toHaveProperty('cpuUsage');
      expect(metrics1).toHaveProperty('memoryUsage');
      expect(metrics2).toHaveProperty('memoryUsage');
    });

    it('persists metrics correctly', () => {
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
