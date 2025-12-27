import { resolveBinary, binaryExists } from '@/lib/binary-lookup';
import { promises as fs } from 'fs';

jest.mock('fs');

describe('binary-lookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveBinary', () => {
    it('resolves binary path for given model', () => {
      const model = 'test-model';
      const result = resolveBinary(model);
      expect(result).toContain(model);
      expect(result).toContain('model.bin');
      expect(result).toContain('data');
      expect(result).toContain('models');
    });

    it('handles model name with special characters', () => {
      const model = 'my-model-123';
      const result = resolveBinary(model);
      expect(result).toContain('my-model-123');
    });

    it('uses process.cwd() for base path', () => {
      const cwd = process.cwd();
      const result = resolveBinary('test');
      expect(result).toContain(cwd);
    });
  });

  describe('binaryExists', () => {
    it('returns true when binary exists', async () => {
      const mockAccess = jest.fn().mockResolvedValue(undefined);
      (fs.access as jest.Mock) = mockAccess;

      const result = await binaryExists('test-model');
      expect(result).toBe(true);
      expect(mockAccess).toHaveBeenCalled();
    });

    it('returns false when binary does not exist', async () => {
      const mockAccess = jest.fn().mockRejectedValue(new Error('File not found'));
      (fs.access as jest.Mock) = mockAccess;

      const result = await binaryExists('test-model');
      expect(result).toBe(false);
    });

    it('returns false for any access error', async () => {
      const mockAccess = jest.fn().mockRejectedValue(new Error('Permission denied'));
      (fs.access as jest.Mock) = mockAccess;

      const result = await binaryExists('test-model');
      expect(result).toBe(false);
    });

    it('checks for R_OK permission', async () => {
      const mockAccess = jest.fn().mockResolvedValue(undefined);
      (fs.access as jest.Mock) = mockAccess;

      await binaryExists('test-model');
      expect(mockAccess).toHaveBeenCalledWith(
        expect.stringContaining('test-model'),
        expect.any(Number)
      );
    });

    it('handles empty model name', async () => {
      const mockAccess = jest.fn().mockRejectedValue(new Error('Invalid path'));
      (fs.access as jest.Mock) = mockAccess;

      const result = await binaryExists('');
      expect(result).toBe(false);
    });
  });
});
