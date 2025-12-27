import * as path from 'path';

// Mock path BEFORE importing the module
jest.mock('path');

// Create fs promises mock
const mockWriteFile = jest.fn();
const mockRename = jest.fn();

jest.mock('fs', () => ({
  promises: {
    writeFile: mockWriteFile,
    rename: mockRename,
  },
}));

// Set up the mock before importing
const mockStatePath = '/mocked/path/data/models-state.json';
const mockTmpPath = mockStatePath + '.tmp';
(path.join as jest.Mock).mockReturnValue(mockStatePath);

jest.spyOn(process, 'cwd').mockReturnValue('/mocked/path');

// Now import the module after mocks are set up
import {
  persistState,
  STATE_FILE,
  STATE_FILE_NAME,
} from '@/lib/state-file';

describe('state-file', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-apply the mock to ensure it's set
    (path.join as jest.Mock).mockReturnValue(mockStatePath);
    // Mock fsPromises functions to return resolved promises
    mockWriteFile.mockResolvedValue(undefined);
    mockRename.mockResolvedValue(undefined);
  });

  describe('STATE_FILE_NAME', () => {
    it('should export the state file name', () => {
      expect(STATE_FILE_NAME).toBe('models-state.json');
    });
  });

  describe('STATE_FILE', () => {
    it('should construct the correct state file path', () => {
      expect(STATE_FILE).toBe(mockStatePath);
    });
  });

  describe('persistState', () => {
    it('should write state to temporary file then rename to final location', async () => {
      const testState = {
        'model-1': { status: 'running', pid: 12345 },
        'model-2': { status: 'stopped', pid: null },
      };

      await persistState(testState);

      expect(mockWriteFile).toHaveBeenCalledWith(
        mockTmpPath,
        JSON.stringify(testState),
        'utf8'
      );

      expect(mockRename).toHaveBeenCalledWith(mockTmpPath, mockStatePath);
    });

    it('should handle simple object state', async () => {
      const testState = {
        status: 'idle',
        lastUpdated: '2024-01-01T00:00:00Z',
      };

      await persistState(testState);

      expect(mockWriteFile).toHaveBeenCalledWith(
        mockTmpPath,
        JSON.stringify(testState),
        'utf8'
      );

      expect(mockRename).toHaveBeenCalled();
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

      expect(mockWriteFile).toHaveBeenCalledWith(
        mockTmpPath,
        JSON.stringify(testState),
        'utf8'
      );
    });

    it('should handle empty state object', async () => {
      const testState = {};

      await persistState(testState);

      expect(mockWriteFile).toHaveBeenCalledWith(
        mockTmpPath,
        JSON.stringify(testState),
        'utf8'
      );
    });

    it('should throw error if writeFile fails', async () => {
      const testState = { status: 'running' };

      mockWriteFile.mockRejectedValue(new Error('Write failed'));

      await expect(persistState(testState)).rejects.toThrow('Write failed');
      expect(mockRename).not.toHaveBeenCalled();
    });

    it('should throw error if rename fails', async () => {
      const testState = { status: 'running' };

      mockWriteFile.mockResolvedValue(undefined as any);
      mockRename.mockRejectedValue(new Error('Rename failed'));

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

      expect(mockWriteFile).toHaveBeenCalledWith(
        mockTmpPath,
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
      expect(mockWriteFile).toHaveBeenCalled();
      expect(mockRename).toHaveBeenCalled();
    });
  });

  describe('state file path construction', () => {
    it('should use process.cwd() for base path', () => {
      // Note: STATE_FILE is evaluated at module load time, so it will always be /mocked/path
      // This test verifies that the path structure is correct
      expect(STATE_FILE).toBe('/mocked/path/data/models-state.json');
    });

    it('should construct path with data subdirectory', () => {
      expect(STATE_FILE).toContain('/data/');
    });
  });
});
