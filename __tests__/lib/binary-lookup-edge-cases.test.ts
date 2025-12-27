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

describe('binary-lookup edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveBinary', () => {
    // Positive: Resolve binary path for standard model name
    it('should resolve binary path for a model', () => {
      const model = 'llama2';
      const result = resolveBinary(model);

      expect(result).toContain(model);
      expect(result).toContain('model.bin');
      expect(result).toContain('data');
      expect(result).toContain('models');
    });

    // Positive: Resolve with version tags
    it('should handle model names with version tags', () => {
      const model = 'llama2:latest';
      const result = resolveBinary(model);

      expect(result).toContain(model);
    });

    // Positive: Handle complex model names
    it('should handle complex model names', () => {
      const model = 'mistral-7b-instruct-v0.1';
      const result = resolveBinary(model);

      expect(result).toContain(model);
    });

    // Negative: Test with empty string
    it('should handle empty model name', () => {
      const model = '';
      const result = resolveBinary(model);

      expect(result).toContain('model.bin');
    });

    // Negative: Test with special characters
    it('should handle special characters in model name', () => {
      const model = 'model@#$%^&*()';
      const result = resolveBinary(model);

      expect(result).toContain(model);
    });

    // Edge case: Test with very long model name
    it('should handle very long model name', () => {
      const model = 'x'.repeat(1000);
      const result = resolveBinary(model);

      expect(result).toContain(model);
    });

    // Edge case: Test with unicode characters
    it('should handle unicode characters in model name', () => {
      const model = '模型-llama';
      const result = resolveBinary(model);

      expect(result).toContain(model);
    });

    // Edge case: Test with spaces in model name
    it('should handle spaces in model name', () => {
      const model = 'my model name';
      const result = resolveBinary(model);

      expect(result).toContain(model);
    });

    // Edge case: Test with path traversal attempts
    it('should handle path traversal attempts in model name', () => {
      const model = '../../../etc/passwd';
      const result = resolveBinary(model);

      expect(result).toContain(model);
    });

    // Edge case: Test with null/undefined model name
    it('should handle null model name', () => {
      const result = resolveBinary(null as any);

      expect(result).toContain('model.bin');
    });

    it('should handle undefined model name', () => {
      const result = resolveBinary(undefined as any);

      expect(result).toContain('model.bin');
    });

    // Edge case: Test with numeric model name
    it('should handle numeric model name', () => {
      const model = 12345 as any;
      const result = resolveBinary(model);

      expect(result).toContain('12345');
    });

    // Edge case: Test with object model name
    it('should handle object model name', () => {
      const model = { name: 'test' } as any;
      const result = resolveBinary(model);

      expect(result).toContain('[object Object]');
    });
  });

  describe('binaryExists', () => {
    // Positive: Return true when binary file exists and is readable
    it('should return true when binary file exists and is readable', async () => {
      const mockAccess = jest.fn().mockResolvedValue(undefined);
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const exists = await binaryExists('test-model');

      expect(exists).toBe(true);
      expect(fs.access).toHaveBeenCalled();
    });

    // Positive: Check with correct file path
    it('should call fs.access with correct path', async () => {
      const mockAccess = jest.fn().mockResolvedValue(undefined);
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const model = 'test-model';
      await binaryExists(model);

      expect(mockAccess).toHaveBeenCalledWith(
        expect.stringContaining(model),
        expect.any(Number)
      );
    });

    // Negative: Return false when binary file does not exist (ENOENT)
    it('should return false when binary file does not exist (ENOENT)', async () => {
      const error: any = new Error('File not found');
      error.code = 'ENOENT';
      const mockAccess = jest.fn().mockRejectedValue(error);
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const exists = await binaryExists('non-existent-model');

      expect(exists).toBe(false);
    });

    // Negative: Return false when binary file is not readable (EACCES)
    it('should return false when binary file is not readable (EACCES)', async () => {
      const error: any = new Error('Permission denied');
      error.code = 'EACCES';
      const mockAccess = jest.fn().mockRejectedValue(error);
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const exists = await binaryExists('unreadable-model');

      expect(exists).toBe(false);
    });

    // Negative: Handle unknown errors gracefully
    it('should return false for unknown errors', async () => {
      const mockAccess = jest.fn().mockRejectedValue(new Error('Unknown error'));
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const exists = await binaryExists('error-model');

      expect(exists).toBe(false);
    });

    // Negative: Handle timeout errors
    it('should return false for timeout errors', async () => {
      const error: any = new Error('Timeout');
      error.code = 'ETIMEDOUT';
      const mockAccess = jest.fn().mockRejectedValue(error);
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const exists = await binaryExists('timeout-model');

      expect(exists).toBe(false);
    });

    // Negative: Handle IO errors
    it('should return false for IO errors', async () => {
      const error: any = new Error('IO error');
      error.code = 'EIO';
      const mockAccess = jest.fn().mockRejectedValue(error);
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const exists = await binaryExists('io-error-model');

      expect(exists).toBe(false);
    });

    // Edge case: Handle empty model name
    it('should handle empty model name', async () => {
      const mockAccess = jest.fn().mockRejectedValue(new Error('ENOENT'));
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const exists = await binaryExists('');

      expect(exists).toBe(false);
    });

    // Edge case: Handle very long model name
    it('should handle very long model name', async () => {
      const longModel = 'x'.repeat(1000);
      const mockAccess = jest.fn().mockRejectedValue(new Error('ENOENT'));
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const exists = await binaryExists(longModel);

      expect(exists).toBe(false);
    });

    // Edge case: Handle special characters
    it('should handle special characters in model name', async () => {
      const mockAccess = jest.fn().mockRejectedValue(new Error('ENOENT'));
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const exists = await binaryExists('model@#$%^&*()');

      expect(exists).toBe(false);
    });

    // Edge case: Handle unicode characters
    it('should handle unicode characters in model name', async () => {
      const mockAccess = jest.fn().mockResolvedValue(undefined);
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const exists = await binaryExists('模型-llama');

      expect(exists).toBe(true);
    });

    // Edge case: Handle null/undefined model name
    it('should handle null model name', async () => {
      const mockAccess = jest.fn().mockRejectedValue(new Error());
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const exists = await binaryExists(null as any);

      expect(exists).toBe(false);
    });

    it('should handle undefined model name', async () => {
      const mockAccess = jest.fn().mockRejectedValue(new Error());
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const exists = await binaryExists(undefined as any);

      expect(exists).toBe(false);
    });

    // Edge case: Handle numeric model name
    it('should handle numeric model name', async () => {
      const mockAccess = jest.fn().mockResolvedValue(undefined);
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const exists = await binaryExists(12345 as any);

      expect(exists).toBe(true);
    });

    // Edge case: Handle concurrent calls
    it('should handle concurrent calls', async () => {
      const mockAccess = jest.fn().mockResolvedValue(undefined);
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const promises = [
        binaryExists('model1'),
        binaryExists('model2'),
        binaryExists('model3'),
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual([true, true, true]);
      expect(mockAccess).toHaveBeenCalledTimes(3);
    });

    // Edge case: Handle rapid successive calls
    it('should handle rapid successive calls', async () => {
      const mockAccess = jest.fn().mockResolvedValue(undefined);
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      for (let i = 0; i < 100; i++) {
        await binaryExists(`model${i}`);
      }

      expect(mockAccess).toHaveBeenCalledTimes(100);
    });
  });

  describe('integration', () => {
    it('should resolve and check binary existence together', async () => {
      const mockAccess = jest.fn().mockResolvedValue(undefined);
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const model = 'test-model';
      const resolvedPath = resolveBinary(model);
      const exists = await binaryExists(model);

      expect(resolvedPath).toContain(model);
      expect(exists).toBe(true);
    });

    it('should handle full workflow for non-existent model', async () => {
      const error: any = new Error('File not found');
      error.code = 'ENOENT';
      const mockAccess = jest.fn().mockRejectedValue(error);
      (fs.access as jest.Mock).mockImplementation(mockAccess);

      const model = 'non-existent-model';
      const resolvedPath = resolveBinary(model);
      const exists = await binaryExists(model);

      expect(resolvedPath).toContain(model);
      expect(exists).toBe(false);
    });

    it('should work with different error codes', async () => {
      const errorCodes = ['ENOENT', 'EACCES', 'ENOTDIR', 'ELOOP', 'ENAMETOOLONG'];

      for (const code of errorCodes) {
        const error: any = new Error(`Error ${code}`);
        error.code = code;
        const mockAccess = jest.fn().mockRejectedValue(error);
        (fs.access as jest.Mock).mockImplementation(mockAccess);

        const exists = await binaryExists(`model-${code}`);

        expect(exists).toBe(false);
      }
    });
  });
});
