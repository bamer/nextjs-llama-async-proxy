import { writeHistory } from '@/lib/monitor';
import { mockedFs, createMockHistory } from './agent1-utilities.test-utils';

describe('Monitor - writeHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should write history to file atomically', () => {
    const mockHistory = createMockHistory();

    mockedFs.writeFileSync.mockImplementation(() => undefined);
    mockedFs.renameSync.mockImplementation(() => undefined);

    writeHistory(mockHistory);

    expect(mockedFs.writeFileSync).toHaveBeenCalled();
    expect(mockedFs.renameSync).toHaveBeenCalled();
  });

  it('should use temporary file for atomic write', () => {
    const mockHistory = createMockHistory();

    mockedFs.writeFileSync.mockImplementation(() => undefined);
    mockedFs.renameSync.mockImplementation(() => undefined);

    writeHistory(mockHistory);

    const writeCall = (mockedFs.writeFileSync as jest.Mock).mock.calls[0];
    expect(writeCall[0]).toContain('.tmp');
  });

  it('should format history as JSON with proper indentation', () => {
    const mockHistory = [{ cpuUsage: 50, id: 1 }];

    mockedFs.writeFileSync.mockImplementation(() => undefined);
    mockedFs.renameSync.mockImplementation(() => undefined);

    writeHistory(mockHistory);

    const writeCall = (mockedFs.writeFileSync as jest.Mock).mock.calls[0];
    const content = writeCall[1];

    expect(content).toContain('\n');
    expect(JSON.parse(content)).toEqual(mockHistory);
  });

  it('should handle writeFileSync errors gracefully', () => {
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

  it('should handle renameSync errors gracefully', () => {
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
