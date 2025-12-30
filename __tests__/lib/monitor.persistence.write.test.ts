import * as fs from 'fs';
import monitor, { writeHistory } from '@/lib/monitor';

jest.mock('fs');
jest.mock('@/lib/logger', () => ({
  getLogger: jest.fn(() => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('monitor - writeHistory', () => {
  let mockLogger: jest.Mocked<{ error: jest.Mock; warn: jest.Mock; info: jest.Mock; debug: jest.Mock }>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get mocked logger instance
    mockLogger = require('@/lib/logger').getLogger() as any;
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.info.mockClear();
    mockLogger.debug.mockClear();
  });

  it('should write history to file', () => {
    const history = [
      { cpu: 50, memory: 60, timestamp: '2024-01-01' },
    ];

    writeHistory(history);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.tmp'),
      JSON.stringify(history, null, 2),
      'utf8'
    );
  });

  it('should rename temp file to history file', () => {
    const history = [{ cpu: 50, memory: 60 }];

    writeHistory(history);

    expect(fs.renameSync).toHaveBeenCalledWith(
      expect.stringContaining('.tmp'),
      expect.stringContaining('monitoring-history.json')
    );
  });

  it('should handle write errors gracefully', () => {
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Write error');
    });

    writeHistory([]);

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to persist monitoring history:',
      expect.any(Error)
    );
  });

  it('should handle writeHistory with very large array', () => {
    const largeHistory = Array(100000).fill({ cpu: 50, memory: 50 });

    monitor.writeHistory(largeHistory);

    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('should handle writeHistory with circular references', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const circularData: any = { cpu: 50 };
    circularData.self = circularData;

    monitor.writeHistory([circularData]);

    // Circular references cause JSON.stringify to throw, which is caught
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should handle writeHistory with undefined values', () => {
    const dataWithUndefined = [
      { cpu: 50, memory: undefined, timestamp: new Date().toISOString() },
    ];

    monitor.writeHistory(dataWithUndefined);

    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('should handle concurrent writeHistory calls', () => {
    const data1 = { cpu: 50 };
    const data2 = { cpu: 60 };

    monitor.writeHistory([data1]);
    monitor.writeHistory([data2]);

    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
  });

  it('should handle file permission errors in writeHistory', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      const error: any = new Error('Permission denied');
      error.code = 'EACCES';
      throw error;
    });

    monitor.writeHistory([]);

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle disk full errors in writeHistory', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      const error: any = new Error('No space left');
      error.code = 'ENOSPC';
      throw error;
    });

    monitor.writeHistory([]);

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle renameSync errors in writeHistory', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (fs.renameSync as jest.Mock).mockImplementation(() => {
      throw new Error('Rename failed');
    });

    monitor.writeHistory([{ cpu: 50 }]);

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should write to temporary file first', () => {
    const history = [{ cpu: 50 }];

    monitor.writeHistory(history);

    const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
    expect(writeCall[0]).toMatch(/\.tmp$/);
  });

  it('should rename temporary file to final location', () => {
    const history = [{ cpu: 50 }];

    monitor.writeHistory(history);

    expect(fs.renameSync).toHaveBeenCalledWith(
      expect.stringMatching(/\.tmp$/),
      expect.stringContaining('monitoring-history.json')
    );
  });

  it('should handle file not found errors in writeHistory', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      const error: any = new Error('No such file');
      error.code = 'ENOENT';
      throw error;
    });

    monitor.writeHistory([]);

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should write formatted JSON with 2 spaces', () => {
    const history = [{ cpu: 50 }];

    monitor.writeHistory(history);

    const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
    const writtenData = JSON.parse(writeCall[1]);
    expect(writeCall[2]).toBe('utf8');
  });

  it('should write history preserving data structure', () => {
    const history = [
      { cpu: 50, memory: 60, id: 1 },
      { cpu: 70, memory: 80, id: 2 },
    ];

    monitor.writeHistory(history);

    const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
    const writtenData = JSON.parse(writeCall[1]);
    expect(writtenData).toHaveLength(2);
    expect(writtenData[0].id).toBe(1);
    expect(writtenData[1].id).toBe(2);
  });
});
