import {
  captureMetrics,
  startPeriodicRecording,
  readHistory,
  writeHistory
} from '@/lib/monitor';
import fs from 'fs';
import path from 'path';

jest.mock('fs');
jest.mock('path');

const mockPath = {
  join: jest.fn((...args) => args.join('/')),
};
(path.join as jest.Mock) = mockPath.join;

describe('monitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('captureMetrics', () => {
    it('returns metrics object with all required fields', () => {
      const metrics = captureMetrics();
      expect(metrics).toHaveProperty('cpuUsage');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('uptimeSeconds');
      expect(metrics).toHaveProperty('timestamp');
    });

    it('returns valid CPU usage (0-100)', () => {
      const metrics = captureMetrics();
      expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
    });

    it('returns valid memory usage (0-100)', () => {
      const metrics = captureMetrics();
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeLessThanOrEqual(100);
    });

    it('returns valid uptime seconds', () => {
      const metrics = captureMetrics();
      expect(metrics.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(typeof metrics.uptimeSeconds).toBe('number');
    });

    it('returns valid ISO timestamp', () => {
      const metrics = captureMetrics();
      const timestamp = new Date(metrics.timestamp);
      expect(timestamp.toISOString()).toBe(metrics.timestamp);
    });

    it('cpuUsage is a number', () => {
      const metrics = captureMetrics();
      expect(typeof metrics.cpuUsage).toBe('number');
    });

    it('memoryUsage is a number', () => {
      const metrics = captureMetrics();
      expect(typeof metrics.memoryUsage).toBe('number');
    });

    it('timestamp is a string', () => {
      const metrics = captureMetrics();
      expect(typeof metrics.timestamp).toBe('string');
    });
  });

  describe('readHistory', () => {
    it('returns empty array when file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const history = readHistory();
      expect(history).toEqual([]);
    });

    it('returns empty array on parse error', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');
      const history = readHistory();
      expect(history).toEqual([]);
    });

    it('returns parsed history when file exists', () => {
      const mockHistory = [{ cpuUsage: 50, timestamp: '2024-01-01' }];
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockHistory));
      const history = readHistory();
      expect(history).toEqual(mockHistory);
    });

    it('handles fs read errors', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Read error');
      });
      const history = readHistory();
      expect(history).toEqual([]);
    });
  });

  describe('writeHistory', () => {
    it('writes history to file', () => {
      const mockHistory = [{ cpuUsage: 50, timestamp: '2024-01-01' }];
      const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation();

      writeHistory(mockHistory);

      expect(writeSpy).toHaveBeenCalled();
      expect(renameSpy).toHaveBeenCalled();

      writeSpy.mockRestore();
      renameSpy.mockRestore();
    });

    it('writes as JSON', () => {
      const mockHistory = [{ cpuUsage: 50 }];
      const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation();

      writeHistory(mockHistory);

      expect(JSON.parse(writeSpy.mock.calls[0][1])).toEqual(mockHistory);

      writeSpy.mockRestore();
      renameSpy.mockRestore();
    });

    it('uses atomic write pattern', () => {
      const mockHistory = [{ cpuUsage: 50 }];
      const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation();

      writeHistory(mockHistory);

      expect(writeSpy).toHaveBeenCalledWith(
        expect.stringContaining('.tmp'),
        expect.any(String),
        'utf8'
      );
      expect(renameSpy).toHaveBeenCalled();

      writeSpy.mockRestore();
      renameSpy.mockRestore();
    });

    it('handles write errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Write error');
      });

      expect(() => writeHistory([])).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('startPeriodicRecording', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('does not start if already running', () => {
      const initialInterval = (global as any).recordingInterval;
      startPeriodicRecording();
      startPeriodicRecording();
      expect((global as any).recordingInterval).toBe(initialInterval);
    });

    it('starts interval if not running', () => {
      startPeriodicRecording();
      expect((global as any).recordingInterval).toBeDefined();
    });
  });

  describe('periodic recording behavior', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('records metrics every 30 seconds', () => {
      const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation();
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.readFileSync as jest.Mock).mockReturnValue('[]');

      startPeriodicRecording();
      jest.advanceTimersByTime(30000);

      expect(writeSpy).toHaveBeenCalled();

      writeSpy.mockRestore();
      renameSpy.mockRestore();
    });

    it('adds id to metrics entries', () => {
      const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation();
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.readFileSync as jest.Mock).mockReturnValue('[]');

      startPeriodicRecording();
      jest.advanceTimersByTime(30000);

      const writtenData = JSON.parse(writeSpy.mock.calls[0][1]);
      expect(writtenData[0]).toHaveProperty('id');
      expect(typeof writtenData[0].id).toBe('number');

      writeSpy.mockRestore();
      renameSpy.mockRestore();
    });

    it('appends to existing history', () => {
      const existingHistory = [{ id: 1, cpuUsage: 50 }];
      const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation();
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(existingHistory));

      startPeriodicRecording();
      jest.advanceTimersByTime(30000);

      const writtenData = JSON.parse(writeSpy.mock.calls[0][1]);
      expect(writtenData.length).toBeGreaterThan(1);

      writeSpy.mockRestore();
      renameSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('handles empty history', () => {
      const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation();
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.readFileSync as jest.Mock).mockReturnValue('[]');

      writeHistory([]);

      const writtenData = JSON.parse(writeSpy.mock.calls[0][1]);
      expect(writtenData).toEqual([]);

      writeSpy.mockRestore();
      renameSpy.mockRestore();
    });

    it('handles large history', () => {
      const largeHistory = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        cpuUsage: 50,
        timestamp: '2024-01-01'
      }));
      const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation();

      writeHistory(largeHistory);

      expect(writeSpy).toHaveBeenCalled();

      writeSpy.mockRestore();
      renameSpy.mockRestore();
    });

    it('handles null values in history', () => {
      const historyWithNull = [{ cpuUsage: null as any, timestamp: '2024-01-01' }];
      const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation();

      expect(() => writeHistory(historyWithNull)).not.toThrow();

      writeSpy.mockRestore();
      renameSpy.mockRestore();
    });
  });
});
