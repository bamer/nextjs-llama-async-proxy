const mockJoin = jest.fn((...args: string[]) => args.join('/'));

jest.mock('path', () => ({
  join: mockJoin,
}));

jest.spyOn(process, 'cwd').mockReturnValue('/test/project');

const mockAccess = jest.fn();

jest.mock('fs', () => ({
  constants: {
    R_OK: 4,
  },
  promises: {
    access: mockAccess,
  },
}));

import {
  resolveBinary,
  binaryExists,
} from '@/lib/binary-lookup';

describe('binary-lookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccess.mockReset();
  });

  describe('resolveBinary', () => {
    it('should return correct binary path for valid model name', () => {
      const result = resolveBinary('llama2');
      const expectedPath = '/test/project/data/models/llama2/model.bin';

      expect(result).toBe(expectedPath);
    });

    it('should handle model names with underscores', () => {
      const result = resolveBinary('my_model_name');
      const expectedPath = '/test/project/data/models/my_model_name/model.bin';

      expect(result).toBe(expectedPath);
    });

    it('should handle model names with hyphens', () => {
      const result = resolveBinary('my-model-name');
      const expectedPath = '/test/project/data/models/my-model-name/model.bin';

      expect(result).toBe(expectedPath);
    });
  });

  describe('binaryExists', () => {
    it('should return true when binary file exists and is readable', async () => {
      mockAccess.mockResolvedValue(undefined);

      const result = await binaryExists('llama2');

      expect(result).toBe(true);
      expect(mockAccess).toHaveBeenCalledWith('/test/project/data/models/llama2/model.bin', 4);
    });

    it('should return false when binary file does not exist', async () => {
      mockAccess.mockRejectedValue(new Error('File not found'));

      const result = await binaryExists('nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when binary file is not readable', async () => {
      mockAccess.mockRejectedValue(new Error('Permission denied'));

      const result = await binaryExists('unreadable');

      expect(result).toBe(false);
    });

    it('should return false for any error during access check', async () => {
      mockAccess.mockRejectedValue(new Error('Unexpected error'));

      const result = await binaryExists('error-model');

      expect(result).toBe(false);
    });

    it('should use resolveBinary to construct file path', async () => {
      mockAccess.mockResolvedValue(undefined);

      await binaryExists('test-model');

      expect(mockAccess).toHaveBeenCalledWith('/test/project/data/models/test-model/model.bin', 4);
    });

    it('should handle rejection with non-Error object', async () => {
      mockAccess.mockRejectedValue({ message: 'Some error' });

      const result = await binaryExists('test-model');

      expect(result).toBe(false);
    });

    it('should handle rejection with string', async () => {
      mockAccess.mockRejectedValue('Error string');

      const result = await binaryExists('test-model');

      expect(result).toBe(false);
    });

    it('should handle rejection with null', async () => {
      mockAccess.mockRejectedValue(null);

      const result = await binaryExists('test-model');

      expect(result).toBe(false);
    });
  });
});
