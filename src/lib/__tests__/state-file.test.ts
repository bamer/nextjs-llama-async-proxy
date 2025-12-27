import {
  persistState,
  STATE_FILE,
  STATE_FILE_NAME,
} from '@/lib/state-file';
import { promises as fsPromises } from 'fs';
import path from 'path';

jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
    rename: jest.fn(),
  },
}));

jest.mock('path', () => ({
  join: jest.fn(),
}));

const mockedWriteFile = fsPromises.writeFile as jest.MockedFunction<typeof fsPromises.writeFile>;
const mockedRename = fsPromises.rename as jest.MockedFunction<typeof fsPromises.rename>;
const mockedJoin = path.join as jest.MockedFunction<typeof path.join>;

describe('state-file', () => {
  const mockStateFile = '/mocked/path/data/models-state.json';
  const mockTempFile = '/mocked/path/data/models-state.json.tmp';

  beforeEach(() => {
    jest.clearAllMocks();
    mockedJoin.mockImplementation((...args) => args.join('/'));
    jest.spyOn(process, 'cwd').mockReturnValue('/mocked/path');
  });

  describe('STATE_FILE_NAME', () => {
    it('should export the state file name', () => {
      expect(STATE_FILE_NAME).toBe('models-state.json');
    });
  });

  describe('STATE_FILE', () => {
    it('should construct the correct state file path', () => {
      expect(STATE_FILE).toBe(mockStateFile);
    });
  });

  describe('persistState', () => {
    it('should write state to temporary file then rename to final location', async () => {
      const testState = {
        'model-1': { status: 'running', pid: 12345 },
        'model-2': { status: 'stopped', pid: null },
      };

      await persistState(testState);

      expect(mockedWriteFile).toHaveBeenCalledWith(
        mockTempFile,
        JSON.stringify(testState),
        'utf8'
      );

      expect(mockedRename).toHaveBeenCalledWith(mockTempFile, mockStateFile);
    });

    it('should handle simple object state', async () => {
      const testState = {
        status: 'idle',
        lastUpdated: '2024-01-01T00:00:00Z',
      };

      await persistState(testState);

      expect(mockedWriteFile).toHaveBeenCalledWith(
        mockTempFile,
        JSON.stringify(testState),
        'utf8'
      );

      expect(mockedRename).toHaveBeenCalled();
    });

    it('should handle complex nested state', async () => {
      const testState = {
        models: {
          'llama2': {
            config: { temperature: 0.7, top_p: 0.9 },
            status: 'running',
            metrics: { requests: 100, errors: 2 },
          },
        },
        global: {
          startTime: '2024-01-01T00:00:00Z',
          uptime: 3600,
        },
      };

      await persistState(testState);

      expect(mockedWriteFile).toHaveBeenCalledWith(
        mockTempFile,
        JSON.stringify(testState),
        'utf8'
      );
    });

    it('should handle empty state object', async () => {
      const testState = {};

      await persistState(testState);

      expect(mockedWriteFile).toHaveBeenCalledWith(
        mockTempFile,
        JSON.stringify(testState),
        'utf8'
      );
    });

    it('should throw error if writeFile fails', async () => {
      const testState = { status: 'running' };

      mockedWriteFile.mockRejectedValue(new Error('Write failed'));

      await expect(persistState(testState)).rejects.toThrow('Write failed');
      expect(mockedRename).not.toHaveBeenCalled();
    });

    it('should throw error if rename fails', async () => {
      const testState = { status: 'running' };

      mockedWriteFile.mockResolvedValue(undefined as any);
      mockedRename.mockRejectedValue(new Error('Rename failed'));

      await expect(persistState(testState)).rejects.toThrow('Rename failed');
    });

    it('should serialize state correctly with special characters', async () => {
      const testState = {
        'model-name with spaces': {
          'special"chars': 'value',
          emoji: '🚀',
        },
      };

      await persistState(testState);

      expect(mockedWriteFile).toHaveBeenCalledWith(
        mockTempFile,
        JSON.stringify(testState),
        'utf8'
      );
    });

    it('should ensure atomic write operation', async () => {
      const testState = { status: 'running' };

      const writePromise = persistState(testState);

      // At this point, temp file should be written but not renamed yet
      await writePromise;

      // Verify order: write first, then rename
      expect(mockedWriteFile).toHaveBeenCalled();
      expect(mockedRename).toHaveBeenCalledAfter(mockedWriteFile);
    });
  });

  describe('state file path construction', () => {
    it('should use process.cwd() for base path', () => {
      const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue('/custom/path');

      mockedJoin.mockImplementation((...args) => args.join('/'));

      const expectedPath = '/custom/path/data/models-state.json';
      expect(STATE_FILE).toContain(expectedPath);

      cwdSpy.mockRestore();
    });

    it('should construct path with data subdirectory', () => {
      expect(STATE_FILE).toContain('/data/');
    });
  });
});
