import { ProcessManagerAPI, ModelProcessInfo, ProcessManager } from '@/lib/process-manager';
import { spawn } from 'child_process';
import { resolveBinary, binaryExists } from '@/lib/binary-lookup';

jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

jest.mock('@/lib/binary-lookup', () => ({
  resolveBinary: jest.fn(),
  binaryExists: jest.fn(),
}));

const mockedSpawn = spawn as jest.MockedFunction<typeof spawn>;
const mockedResolveBinary = resolveBinary as jest.MockedFunction<typeof resolveBinary>;
const mockedBinaryExists = binaryExists as jest.MockedFunction<typeof binaryExists>;

describe('ProcessManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the static process map
    ProcessManager._reset();
    mockedBinaryExists.mockResolvedValue(true);
    mockedResolveBinary.mockReturnValue('/path/to/model.bin');
  });

  describe('start', () => {
    it('should start a new process and return process info', async () => {
      const mockChild = {
        pid: 12345,
        unref: jest.fn(),
      };

      mockedBinaryExists.mockResolvedValue(true);
      mockedResolveBinary.mockReturnValue('/path/to/model.bin');
      mockedSpawn.mockReturnValue(mockChild as any);

      const result = await ProcessManagerAPI.start('test-model');

      expect(result).toEqual({
        pid: 12345,
        launchedAt: expect.any(Number),
        model: 'test-model',
      } as ModelProcessInfo);

      expect(mockedBinaryExists).toHaveBeenCalledWith('test-model');
      expect(mockedResolveBinary).toHaveBeenCalledWith('test-model');
      expect(mockedSpawn).toHaveBeenCalledWith(
        '/home/bamer/llama.cpp/build/bin/llama.cpp',
        [
          '-m',
          '/path/to/model.bin',
          '-c',
          '2048',
          '-ngl',
          '0',
          '-p',
          '"prompt=Hello from Next.js API"',
        ],
        { detached: true, stdio: 'ignore' }
      );
      expect(mockChild.unref).toHaveBeenCalled();
    });

    it('should return cached process if already running', async () => {
      const mockChild = {
        pid: 12345,
        unref: jest.fn(),
      };

      mockedBinaryExists.mockResolvedValue(true);
      mockedResolveBinary.mockReturnValue('/path/to/model.bin');
      mockedSpawn.mockReturnValue(mockChild as any);

      // Start first process
      const firstResult = await ProcessManagerAPI.start('test-model');

      // Try to start same model again
      const secondResult = await ProcessManagerAPI.start('test-model');

      expect(firstResult.pid).toBe(secondResult.pid);
      expect(mockedSpawn).toHaveBeenCalledTimes(1);
    });

    it('should throw error if binary does not exist', async () => {
      mockedBinaryExists.mockRejectedValue(new Error('Binary not found'));

      await expect(ProcessManagerAPI.start('test-model')).rejects.toThrow(
        'Binary not found'
      );
    });

    it('should handle process without pid', async () => {
      const mockChild = {
        unref: jest.fn(),
      };

      mockedBinaryExists.mockResolvedValue(true);
      mockedResolveBinary.mockReturnValue('/path/to/model.bin');
      mockedSpawn.mockReturnValue(mockChild as any);

      const result = await ProcessManagerAPI.start('test-model');

      expect(result.pid).toBeUndefined();
    });
  });

  describe('stop', () => {
    it('should stop a running process and return true', async () => {
      const mockChild = {
        pid: 12345,
        unref: jest.fn(),
      };

      mockedBinaryExists.mockResolvedValue(true);
      mockedResolveBinary.mockReturnValue('/path/to/model.bin');
      mockedSpawn.mockReturnValue(mockChild as any);

      // Start a process
      await ProcessManagerAPI.start('test-model');

      // Mock process.kill
      const mockKill = jest.fn();
      (global as any).process = { ...process, kill: mockKill };

      const result = ProcessManagerAPI.stop('test-model');

      expect(result).toBe(true);
      expect(mockKill).toHaveBeenCalledWith(12345, 'SIGTERM');
    });

    it('should return false if process is not found', () => {
      const result = ProcessManagerAPI.stop('non-existent-model');

      expect(result).toBe(false);
    });

    it('should handle process.kill errors gracefully', async () => {
      const mockChild = {
        pid: 12345,
        unref: jest.fn(),
      };

      mockedBinaryExists.mockResolvedValue(true);
      mockedResolveBinary.mockReturnValue('/path/to/model.bin');
      mockedSpawn.mockReturnValue(mockChild as any);

      await ProcessManagerAPI.start('test-model');

      const mockKill = jest.fn(() => {
        throw new Error('Process not found');
      });
      (global as any).process = { ...process, kill: mockKill };

      const result = ProcessManagerAPI.stop('test-model');

      expect(result).toBe(true); // Still returns true as process is removed from tracking
    });
  });

  describe('getInfo', () => {
    it('should return process info for running model', async () => {
      const mockChild = {
        pid: 12345,
        unref: jest.fn(),
      };

      mockedBinaryExists.mockResolvedValue(true);
      mockedResolveBinary.mockReturnValue('/path/to/model.bin');
      mockedSpawn.mockReturnValue(mockChild as any);

      await ProcessManagerAPI.start('test-model');

      const info = ProcessManagerAPI.getInfo('test-model');

      expect(info).toEqual({
        pid: 12345,
        launchedAt: expect.any(Number),
        model: 'test-model',
      } as ModelProcessInfo);
    });

    it('should return undefined for non-existent model', () => {
      const info = ProcessManagerAPI.getInfo('non-existent-model');

      expect(info).toBeUndefined();
    });
  });

  describe('multiple models', () => {
    it('should manage multiple independent processes', async () => {
      const mockChild1 = { pid: 11111, unref: jest.fn() };
      const mockChild2 = { pid: 22222, unref: jest.fn() };
      const mockChild3 = { pid: 33333, unref: jest.fn() };

      mockedBinaryExists.mockResolvedValue(true);
      mockedResolveBinary.mockImplementation((model) => `/path/to/${model}.bin`);
      mockedSpawn
        .mockReturnValueOnce(mockChild1 as any)
        .mockReturnValueOnce(mockChild2 as any)
        .mockReturnValueOnce(mockChild3 as any);

      const result1 = await ProcessManagerAPI.start('model1');
      const result2 = await ProcessManagerAPI.start('model2');
      const result3 = await ProcessManagerAPI.start('model3');

      expect(result1.pid).toBe(11111);
      expect(result2.pid).toBe(22222);
      expect(result3.pid).toBe(33333);

      const info1 = ProcessManagerAPI.getInfo('model1');
      const info2 = ProcessManagerAPI.getInfo('model2');
      const info3 = ProcessManagerAPI.getInfo('model3');

      expect(info1?.pid).toBe(11111);
      expect(info2?.pid).toBe(22222);
      expect(info3?.pid).toBe(33333);
    });
  });
});
