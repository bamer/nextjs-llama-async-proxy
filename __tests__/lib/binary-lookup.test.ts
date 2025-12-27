import { resolveBinary, binaryExists } from '@/lib/binary-lookup';
import { promises as fs } from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs', () => ({
  constants: {
    R_OK: 0,
  },
  promises: {
    access: jest.fn(),
  },
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

describe('binary-lookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('resolveBinary', () => {
    it('should resolve binary path for a model', () => {
      const model = 'test-model';
      const result = resolveBinary(model);

      expect(result).toContain(model);
      expect(result).toContain('model.bin');
      expect(result).toContain('data');
      expect(result).toContain('models');
    });

    it('should handle model names with special characters', () => {
      const model = 'model-123_test';
      const result = resolveBinary(model);

      expect(result).toContain(model);
    });

    it('should handle model names with underscores', () => {
      const model = 'my_model_v2';
      const result = resolveBinary(model);

      expect(result).toContain(model);
    });

    it('should handle model names with hyphens', () => {
      const model = 'my-model-v2';
      const result = resolveBinary(model);

      expect(result).toContain(model);
    });
  });

  describe('binaryExists', () => {
    it('should return true when binary file exists and is readable', async () => {
      const mockAccess = jest.fn().mockResolvedValue(undefined);
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const exists = await binaryExists('test-model');

      expect(exists).toBe(true);
      expect(fs.access).toHaveBeenCalled();
    });

    it('should return false when binary file does not exist', async () => {
      const mockAccess = jest.fn().mockRejectedValue(new Error('ENOENT'));
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const exists = await binaryExists('non-existent-model');

      expect(exists).toBe(false);
    });

    it('should return false when binary file is not readable', async () => {
      const mockAccess = jest.fn().mockRejectedValue(new Error('EACCES'));
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const exists = await binaryExists('unreadable-model');

      expect(exists).toBe(false);
    });

    it('should handle unknown errors gracefully', async () => {
      const mockAccess = jest.fn().mockRejectedValue(new Error('Unknown error'));
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const exists = await binaryExists('error-model');

      expect(exists).toBe(false);
    });

    it('should call fs.access with correct constants', async () => {
      const mockAccess = jest.fn().mockResolvedValue(undefined);
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      await binaryExists('test-model');

      expect(mockAccess).toHaveBeenCalledWith(
        expect.stringContaining('test-model'),
        expect.any(Number)
      );
    });
  });

  describe('integration', () => {
    it('should resolve and check binary existence together', async () => {
      const mockAccess = jest.fn().mockResolvedValue(undefined);
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const model = 'test-model';
      const path = resolveBinary(model);
      const exists = await binaryExists(model);

      expect(path).toContain(model);
      expect(exists).toBe(true);
    });
  });
});
