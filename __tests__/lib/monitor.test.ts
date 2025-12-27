import * as os from 'os';
import * as fs from 'fs';
import monitor, { captureMetrics, startPeriodicRecording, readHistory, writeHistory } from '@/lib/monitor';

jest.mock('fs');
jest.mock('os');

describe('monitor', () => {
  let realSetInterval: typeof setInterval;
  let mockSetInterval: jest.Mock;
  let realCwd: typeof process.cwd;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    realSetInterval = global.setInterval;
    mockSetInterval = jest.fn((callback: any, delay: number) => {
      setTimeout(callback, delay);
      return {} as any;
    });
    global.setInterval = mockSetInterval;

    realCwd = process.cwd;
    process.cwd = jest.fn().mockReturnValue('/test/path');

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
  });

  afterEach(() => {
    jest.useRealTimers();
    global.setInterval = realSetInterval;
    process.cwd = realCwd;
  });

  describe('captureMetrics', () => {
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

      const expectedCpu = Math.round(
        ((100 + 50 + 120 + 60 - (200 + 180)) / (100 + 50 + 120 + 60)) * 100
      );
      expect(metrics.cpuUsage).toBe(expectedCpu);
    });

    it('should calculate memory usage correctly', () => {
      const metrics = captureMetrics();

      const expectedMem = Math.round(
        ((8000000000 - 4000000000) / 8000000000) * 100
      );
      expect(metrics.memoryUsage).toBe(expectedMem);
    });
  });

  describe('readHistory', () => {
    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
    });

    it('should return empty array if file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const history = monitor.readHistory();

      expect(history).toEqual([]);
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    it('should parse and return history from file', () => {
      const mockData = JSON.stringify([
        { cpu: 50, memory: 60, timestamp: '2024-01-01' },
      ]);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockData);

      const history = monitor.readHistory();

      expect(history).toHaveLength(1);
      expect(history[0].cpu).toBe(50);
    });

    it('should handle JSON parse errors gracefully', () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

      const history = monitor.readHistory();

      expect(history).toEqual([]);
    });

    it('should handle file read errors gracefully', () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Read error');
      });

      const history = monitor.readHistory();

      expect(history).toEqual([]);
    });
  });

  describe('writeHistory', () => {
    it('should write history to file', () => {
      const history = [
        { cpu: 50, memory: 60, timestamp: '2024-01-01' },
      ];

      monitor.writeHistory(history);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.tmp'),
        JSON.stringify(history, null, 2),
        'utf8'
      );
    });

    it('should rename temp file to history file', () => {
      const history = [{ cpu: 50, memory: 60 }];

      monitor.writeHistory(history);

      expect(fs.renameSync).toHaveBeenCalledWith(
        expect.stringContaining('.tmp'),
        expect.stringContaining('monitoring-history.json')
      );
    });

    it('should handle write errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Write error');
      });

      monitor.writeHistory([]);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to persist monitoring history:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('startPeriodicRecording', () => {
    it('should start recording interval', () => {
      startPeriodicRecording();

      expect(mockSetInterval).toHaveBeenCalledWith(
        expect.any(Function),
        30000
      );
    });

    it('should not start multiple intervals', () => {
      startPeriodicRecording();
      startPeriodicRecording();

      expect(mockSetInterval).toHaveBeenCalledTimes(1);
    });

    it('should capture and write metrics on interval', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('[]');

      startPeriodicRecording();

      jest.runAllTimers();

      expect(captureMetrics).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should add unique ID to each metric', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('[]');

      startPeriodicRecording();

      jest.runAllTimers();

      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const writtenData = JSON.parse(writeCall[0]);

      expect(writtenData[0]).toHaveProperty('id');
      expect(typeof writtenData[0].id).toBe('number');
    });
  });

  describe('exports', () => {
    it('should export captureMetrics', () => {
      expect(monitor.captureMetrics).toBeDefined();
    });

    it('should export startPeriodicRecording', () => {
      expect(monitor.startPeriodicRecording).toBeDefined();
    });

    it('should export readHistory', () => {
      expect(monitor.readHistory).toBeDefined();
    });

    it('should export writeHistory', () => {
      expect(monitor.writeHistory).toBeDefined();
    });
  });

  describe('CPU calculation edge cases', () => {
    it('should handle zero total time', () => {
      (os.cpus as jest.Mock).mockReturnValue([
        { times: { user: 0, sys: 0, idle: 100 } },
      ]);

      const metrics = monitor.captureMetrics();

      expect(metrics.cpuUsage).toBeDefined();
    });

    it('should handle all idle CPU', () => {
      (os.cpus as jest.Mock).mockReturnValue([
        { times: { user: 0, sys: 0, idle: 100 } },
      ]);

      const metrics = monitor.captureMetrics();

      expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
    });

    it('should handle all busy CPU', () => {
      (os.cpus as jest.Mock).mockReturnValue([
        { times: { user: 100, sys: 0, idle: 0 } },
      ]);

      const metrics = monitor.captureMetrics();

      expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('memory calculation edge cases', () => {
    it('should handle zero free memory', () => {
      (os.freemem as jest.Mock).mockReturnValue(0);
      (os.totalmem as jest.Mock).mockReturnValue(8000000000);

      const metrics = monitor.captureMetrics();

      expect(metrics.memoryUsage).toBe(100);
    });

    it('should handle all free memory', () => {
      (os.freemem as jest.Mock).mockReturnValue(8000000000);
      (os.totalmem as jest.Mock).mockReturnValue(8000000000);

      const metrics = monitor.captureMetrics();

      expect(metrics.memoryUsage).toBe(0);
    });
  });
});
