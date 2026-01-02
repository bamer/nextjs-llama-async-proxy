/**
 * Test scenarios for history/alert functionality
 * Covers readHistory, writeHistory, and startPeriodicRecording
 */

import { readHistory, writeHistory } from '@/lib/monitor';
import {
  mockedFs,
  setupFsMocks,
  createMockHistory,
  createLargeMockHistory,
  setupMonitorMocks,
} from './monitor-mock-helpers';

describe('readHistory', () => {
  it('returns empty array when file does not exist', () => {
    setupFsMocks(false);
    expect(readHistory()).toEqual([]);
  });

  it('handles read and parse errors', () => {
    setupFsMocks(true);
    mockedFs.readFileSync.mockImplementation(() => { throw new Error('Read error'); });
    expect(readHistory()).toEqual([]);
    mockedFs.readFileSync.mockReturnValue('invalid json');
    expect(readHistory()).toEqual([]);
  });

  it('returns parsed history data', () => {
    const mockHistory = createMockHistory(2);
    setupFsMocks(true, mockHistory);
    expect(readHistory()).toEqual(mockHistory);
  });

  it('handles empty file and large history', () => {
    setupFsMocks(true, '');
    expect(readHistory()).toEqual([]);
    const largeHistory = createLargeMockHistory(10000);
    setupFsMocks(true, largeHistory);
    expect(readHistory()).toHaveLength(10000);
  });

  it('handles invalid entries', () => {
    const invalidHistory = [{ cpuUsage: 45 }, { invalid: 'data' }, null, undefined];
    setupFsMocks(true, invalidHistory);
    expect(readHistory()).toEqual(invalidHistory);
  });
});

describe('writeHistory', () => {
  it('writes to temporary file and renames', () => {
    const mockHistory = [{ cpuUsage: 45 }];
    setupFsMocks(false);
    writeHistory(mockHistory);
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      '/mock/path/monitoring-history.json.tmp',
      JSON.stringify(mockHistory, null, 2),
      'utf8'
    );
    expect(mockedFs.renameSync).toHaveBeenCalledWith(
      '/mock/path/monitoring-history.json.tmp',
      '/mock/path/monitoring-history.json'
    );
  });

  it('handles write and rename errors gracefully', () => {
    mockedFs.writeFileSync.mockImplementation(() => { throw new Error('Write error'); });
    expect(() => writeHistory([])).not.toThrow();
    mockedFs.writeFileSync.mockReturnValue(undefined);
    mockedFs.renameSync.mockImplementation(() => { throw new Error('Rename error'); });
    expect(() => writeHistory([])).not.toThrow();
  });

  it('formats and encodes JSON correctly', () => {
    const mockHistory = [{ cpuUsage: 45 }];
    setupFsMocks(false);
    writeHistory(mockHistory);
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String), expect.stringContaining('  '), 'utf8'
    );
  });

  it('handles empty and large history arrays', () => {
    expect(() => writeHistory([])).not.toThrow();
    expect(() => writeHistory(createLargeMockHistory(10000))).not.toThrow();
  });
});

describe('startPeriodicRecording', () => {
  let startPeriodicRecording: any;

  // Helper to reset monitor module state between tests
  beforeEach(() => {
    jest.resetModules();
    setupMonitorMocks();
    jest.clearAllMocks();
    // Re-import to get fresh module state
    startPeriodicRecording = require('@/lib/monitor').startPeriodicRecording;
  });

  it('starts recording interval', () => {
    startPeriodicRecording();
    expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 30000);
  });

  it('does not start multiple intervals', () => {
    startPeriodicRecording();
    startPeriodicRecording();
    expect(setInterval).toHaveBeenCalledTimes(1);
  });

  it('captures and writes metrics on interval', () => {
    setupFsMocks(false);
    startPeriodicRecording();
    jest.advanceTimersByTime(30000);
    expect(mockedFs.writeFileSync).toHaveBeenCalled();
    expect(mockedFs.renameSync).toHaveBeenCalled();
  });

  it('adds id to metrics entry', () => {
    setupFsMocks(false);
    startPeriodicRecording();
    jest.advanceTimersByTime(30000);
    const history = JSON.parse(mockedFs.writeFileSync.mock.calls[0][1] as string);
    expect(history[0]).toHaveProperty('id');
    expect(typeof history[0].id).toBe('number');
    expect(history[0].id).toBeGreaterThan(0);
  });

  it('records multiple intervals', () => {
    setupFsMocks(false);
    startPeriodicRecording();
    for (let i = 0; i < 5; i++) { jest.advanceTimersByTime(30000); }
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
    const history = JSON.parse(mockedFs.writeFileSync.mock.calls[0][1] as string);
    expect(history).toHaveLength(2);
    expect(history[0]).toEqual(existingHistory[0]);
  });
});
