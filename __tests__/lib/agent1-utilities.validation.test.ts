import { readHistory, writeHistory, captureMetrics } from '@/lib/monitor';
import { mockedFs, createMockHistory, setupFsMocks } from './agent1-utilities.test-utils';

describe('Monitor - Validation', () => {
  const mockHistoryPath = require('path').join(process.cwd(), 'data', 'monitoring-history.json');

  beforeEach(() => {
    jest.clearAllMocks();
    setupFsMocks();
  });

  it('should validate JSON structure on read', () => {
    const mockData = createMockHistory();
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockData));

    const result = readHistory();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should validate metrics structure', () => {
    const metrics = captureMetrics();

    expect(metrics).toHaveProperty('cpuUsage');
    expect(metrics).toHaveProperty('memoryUsage');
    expect(metrics).toHaveProperty('uptimeSeconds');
    expect(metrics).toHaveProperty('timestamp');
  });

  it('should validate data types', () => {
    const metrics = captureMetrics();

    expect(typeof metrics.cpuUsage).toBe('number');
    expect(typeof metrics.memoryUsage).toBe('number');
    expect(typeof metrics.uptimeSeconds).toBe('number');
    expect(typeof metrics.timestamp).toBe('string');
  });

  it('should validate metrics range', () => {
    const metrics = captureMetrics();

    expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
    expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
    expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
    expect(metrics.memoryUsage).toBeLessThanOrEqual(100);
  });

  it('should validate timestamp format', () => {
    const metrics = captureMetrics();

    const isoRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    expect(metrics.timestamp).toMatch(isoRegex);
  });
});
