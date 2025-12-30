import * as fs from 'fs';
import monitor, { readHistory } from '@/lib/monitor';

jest.mock('fs');
jest.mock('@/lib/logger', () => ({
  getLogger: jest.fn(() => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('monitor - readHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });

  it('should return empty array if file does not exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const history = readHistory();

    expect(history).toEqual([]);
    expect(fs.readFileSync).not.toHaveBeenCalled();
  });

  it('should parse and return history from file', () => {
    const mockData = JSON.stringify([
      { cpu: 50, memory: 60, timestamp: '2024-01-01' },
    ]);
    (fs.readFileSync as jest.Mock).mockReturnValue(mockData);

    const history = readHistory();

    expect(history).toHaveLength(1);
    expect(history[0].cpu).toBe(50);
  });

  it('should handle JSON parse errors gracefully', () => {
    (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

    const history = readHistory();

    expect(history).toEqual([]);
  });

  it('should handle file read errors gracefully', () => {
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Read error');
    });

    const history = readHistory();

    expect(history).toEqual([]);
  });

  it('should handle readHistory with corrupted JSON', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('{ invalid json }');

    const history = monitor.readHistory();

    expect(history).toEqual([]);
  });

  it('should handle empty readHistory file', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('');

    const history = monitor.readHistory();

    expect(history).toEqual([]);
  });

  it('should handle readHistory with null bytes in file', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('\x00\x01\x02');

    const history = monitor.readHistory();

    expect(history).toEqual([]);
  });

  it('should handle readHistory with very large file', () => {
    const largeData = JSON.stringify(Array(10000).fill({ cpu: 50 }));
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(largeData);

    const history = monitor.readHistory();

    expect(history.length).toBe(10000);
  });

  it('should handle readHistory with null data', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(null as any);

    const history = monitor.readHistory();

    expect(history).toEqual([]);
  });

  it('should parse JSON file when exists', () => {
    const mockData = JSON.stringify([
      { cpu: 50, memory: 60, timestamp: '2024-01-01' },
    ]);
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(mockData);

    const history = monitor.readHistory();

    expect(history).toHaveLength(1);
    expect(history[0].cpu).toBe(50);
  });

  it('should handle JSON parse errors', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('{ invalid json }');

    const history = monitor.readHistory();

    expect(history).toEqual([]);
  });

  it('should return empty array when file is empty', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('');

    const history = monitor.readHistory();

    expect(history).toEqual([]);
  });
});
