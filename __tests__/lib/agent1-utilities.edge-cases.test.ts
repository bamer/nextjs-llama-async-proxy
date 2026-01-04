import { readHistory, captureMetrics, startPeriodicRecording, monitor } from '@/lib/monitor';
import { mockedFs, setupFsMocks } from './agent1-utilities.test-utils';

describe('Monitor - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupFsMocks();
  });

  it('should handle empty history file', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('[]');

    const result = readHistory();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should handle invalid JSON gracefully', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('not valid json {{{');

    const result = readHistory();

    expect(result).toEqual([]);
  });

  it('should handle system metrics at 0%', () => {
    const metrics = captureMetrics();

    expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
    expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
  });

  it('should handle system metrics at 100%', () => {
    const metrics = captureMetrics();

    expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
    expect(metrics.memoryUsage).toBeLessThanOrEqual(100);
  });

  it('should handle file not found on read', () => {
    mockedFs.existsSync.mockReturnValue(false);

    const result = readHistory();

    expect(result).toEqual([]);
  });
});

describe('Monitor - Export Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupFsMocks();
  });

  it('should export captureMetrics function', () => {
    expect(typeof monitor.captureMetrics).toBe('function');
  });

  it('should export startPeriodicRecording function', () => {
    expect(typeof monitor.startPeriodicRecording).toBe('function');
  });

  it('should export readHistory function', () => {
    expect(typeof monitor.readHistory).toBe('function');
  });

  it('should export writeHistory function', () => {
    expect(typeof monitor.writeHistory).toBe('function');
  });

  it('captureMetrics export should work correctly', () => {
    const metrics = monitor.captureMetrics();

    expect(metrics).toHaveProperty('cpuUsage');
    expect(metrics).toHaveProperty('memoryUsage');
  });

  it('readHistory export should work correctly', () => {
    mockedFs.existsSync.mockReturnValue(false);
    const history = monitor.readHistory();

    expect(history).toEqual([]);
  });
});
