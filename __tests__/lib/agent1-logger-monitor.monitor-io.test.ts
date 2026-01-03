/**
 * AGENT 1: Logger & Monitor Enhancement Tests
 * =============================================
 * Purpose: Enhanced coverage for monitor file I/O operations
 *
 * Target Files:
 * - monitor.ts (86.49% → 98%)
 */

import { readHistory, writeHistory } from '@/lib/monitor';
import fs from 'fs';
import path from 'path';

// Mock logger to call console.error for these tests
jest.mock('@/lib/logger', () => ({
  getLogger: () => ({
    info: jest.fn(),
    error: (...args: any[]) => console.error(...args),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  }),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  readFileSync: jest.fn(() => '[]'),
  writeFileSync: jest.fn(),
  renameSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('Monitor - File I/O Operations', () => {
  const mockHistoryPath = path.join(process.cwd(), 'data', 'monitoring-history.json');

  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.existsSync.mockReturnValue(false);
  });

  describe('readHistory', () => {
    it('should return empty array if file does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      const result = readHistory();

      expect(result).toEqual([]);
    });

    it('should parse valid JSON from file', () => {
      mockedFs.existsSync.mockReturnValue(true);
      const mockData = [
        { cpuUsage: 50, memoryUsage: 60, timestamp: '2024-01-01T00:00:00Z' },
        { cpuUsage: 55, memoryUsage: 65, timestamp: '2024-01-01T00:00:30Z' },
      ];
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      const result = readHistory();

      expect(result).toEqual(mockData);
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(mockHistoryPath, 'utf8');
    });

    it('should return empty array if JSON parsing fails', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('invalid json {{{');

      const result = readHistory();

      expect(result).toEqual([]);
    });

    it('should return empty array on file read error', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });

      const result = readHistory();

      expect(result).toEqual([]);
    });
  });

  describe('writeHistory', () => {
    it('should write history to file atomically', () => {
      const mockHistory: Array<{
        cpuUsage: number;
        memoryUsage: number;
        timestamp: string;
      }> = [
        { cpuUsage: 50, memoryUsage: 60, timestamp: '2024-01-01T00:00:00Z' },
      ];

      mockedFs.writeFileSync.mockImplementation(() => undefined);
      mockedFs.renameSync.mockImplementation(() => undefined);

      writeHistory(mockHistory);

      expect(mockedFs.writeFileSync).toHaveBeenCalled();
      expect(mockedFs.renameSync).toHaveBeenCalled();
    });

    it('should use temporary file for atomic write', () => {
      const mockHistory: Array<{
        cpuUsage: number;
        memoryUsage: number;
        timestamp: string;
      }> = [];

      mockedFs.writeFileSync.mockImplementation(() => undefined);
      mockedFs.renameSync.mockImplementation(() => undefined);

      writeHistory(mockHistory);

      const writeCall = (mockedFs.writeFileSync as jest.Mock).mock.calls[0];
      expect(writeCall[0]).toContain('.tmp');
    });

    it('should format history as JSON with indentation', () => {
      const mockHistory: Array<{
        cpuUsage: number;
        memoryUsage: number;
        timestamp: string;
      }> = [{ cpuUsage: 50 } as any];

      mockedFs.writeFileSync.mockImplementation(() => undefined);
      mockedFs.renameSync.mockImplementation(() => undefined);

      writeHistory(mockHistory);

      const writeCall = (mockedFs.writeFileSync as jest.Mock).mock.calls[0];
      const content = writeCall[1];
      expect(content).toContain(JSON.stringify(mockHistory, null, 2));
    });

    it('should handle write errors gracefully', () => {
      mockedFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      writeHistory([]);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to persist monitoring history:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle rename errors gracefully', () => {
      mockedFs.writeFileSync.mockImplementation(() => undefined);
      mockedFs.renameSync.mockImplementation(() => {
        throw new Error('Rename failed');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      writeHistory([]);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to persist monitoring history:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
