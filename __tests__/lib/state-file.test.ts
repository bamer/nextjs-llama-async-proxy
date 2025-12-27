import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { persistState, STATE_FILE, STATE_FILE_NAME } from '@/lib/state-file';

jest.mock('fs/promises');
jest.mock('path');

describe('state-file', () => {
  const mockStatePath = '/test/path/data/models-state.json';
  const mockTmpPath = mockStatePath + '.tmp';

  beforeEach(() => {
    jest.clearAllMocks();
    (path.join as jest.Mock).mockReturnValue(mockStatePath);
  });

  describe('constants', () => {
    it('should export STATE_FILE_NAME', () => {
      expect(STATE_FILE_NAME).toBe('models-state.json');
    });

    it('should export STATE_FILE path', () => {
      expect(STATE_FILE).toContain('data');
      expect(STATE_FILE).toContain('models-state.json');
    });
  });

  describe('persistState', () => {
    it('should write state to temp file first', async () => {
      const state = { models: ['model1', 'model2'] };

      await persistState(state);

      expect(fsPromises.writeFile).toHaveBeenCalledWith(
        mockTmpPath,
        JSON.stringify(state),
        'utf8'
      );
    });

    it('should rename temp file to state file', async () => {
      const state = { status: 'running' };

      await persistState(state);

      expect(fsPromises.rename).toHaveBeenCalledWith(
        mockTmpPath,
        mockStatePath
      );
    });

    it('should stringify the state object', async () => {
      const state = { models: [{ id: '1', name: 'test' }] };

      await persistState(state);

      const writeCall = (fsPromises.writeFile as jest.Mock).mock.calls[0];
      const writtenData = writeCall[1];

      expect(typeof writtenData).toBe('string');
      expect(JSON.parse(writtenData)).toEqual(state);
    });

    it('should write UTF-8 encoded string', async () => {
      const state = { key: 'value' };

      await persistState(state);

      expect(fsPromises.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'utf8'
      );
    });

    it('should handle empty state object', async () => {
      const state = {};

      await persistState(state);

      expect(fsPromises.writeFile).toHaveBeenCalled();
      expect(fsPromises.rename).toHaveBeenCalled();
    });

    it('should handle nested state object', async () => {
      const state = {
        models: {
          model1: { status: 'running', pid: 123 },
          model2: { status: 'idle', pid: null },
        },
      };

      await persistState(state);

      expect(fsPromises.writeFile).toHaveBeenCalled();
    });

    it('should handle state with arrays', async () => {
      const state = {
        modelIds: ['model1', 'model2', 'model3'],
        timestamps: [1234567890, 1234567891],
      };

      await persistState(state);

      expect(fsPromises.writeFile).toHaveBeenCalled();
    });

    it('should write state in JSON format', async () => {
      const state = { key: 'value' };

      await persistState(state);

      const writeCall = (fsPromises.writeFile as jest.Mock).mock.calls[0];
      const writtenData = writeCall[1];

      expect(() => JSON.parse(writtenData)).not.toThrow();
    });

    it('should handle state with special characters', async () => {
      const state = {
        message: 'Test with "quotes" and \'apostrophes\'',
        special: '\n\t\r',
        unicode: '你好世界 🌍',
      };

      await persistState(state);

      expect(fsPromises.writeFile).toHaveBeenCalled();
    });

    it('should handle state with numbers', async () => {
      const state = {
        count: 42,
        float: 3.14,
        negative: -100,
        zero: 0,
      };

      await persistState(state);

      const writeCall = (fsPromises.writeFile as jest.Mock).mock.calls[0];
      const writtenData = writeCall[1];
      const parsed = JSON.parse(writtenData);

      expect(parsed.count).toBe(42);
      expect(parsed.float).toBe(3.14);
      expect(parsed.negative).toBe(-100);
      expect(parsed.zero).toBe(0);
    });

    it('should handle state with booleans', async () => {
      const state = {
        isActive: true,
        isDeleted: false,
        isEnabled: true,
      };

      await persistState(state);

      const writeCall = (fsPromises.writeFile as jest.Mock).mock.calls[0];
      const writtenData = writeCall[1];
      const parsed = JSON.parse(writtenData);

      expect(parsed.isActive).toBe(true);
      expect(parsed.isDeleted).toBe(false);
      expect(parsed.isEnabled).toBe(true);
    });

    it('should handle state with null values', async () => {
      const state = {
        value1: null,
        value2: 'not null',
        value3: null,
      };

      await persistState(state);

      expect(fsPromises.writeFile).toHaveBeenCalled();
    });

    it('should handle write errors', async () => {
      (fsPromises.writeFile as jest.Mock).mockRejectedValue(
        new Error('Write failed')
      );

      await expect(persistState({ key: 'value' })).rejects.toThrow(
        'Write failed'
      );
    });

    it('should handle rename errors', async () => {
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.rename as jest.Mock).mockRejectedValue(
        new Error('Rename failed')
      );

      await expect(persistState({ key: 'value' })).rejects.toThrow(
        'Rename failed'
      );
    });

    it('should preserve atomic write pattern', async () => {
      const state = { models: ['model1'] };

      await persistState(state);

      const writeCall = (fsPromises.writeFile as jest.Mock).mock.calls[0];
      const renameCall = (fsPromises.rename as jest.Mock).mock.calls[0];

      expect(writeCall[0]).toContain('.tmp');
      expect(renameCall[0]).toContain('.tmp');
      expect(renameCall[1]).not.toContain('.tmp');
    });
  });
});
