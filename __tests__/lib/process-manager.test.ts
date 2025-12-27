import { spawn } from 'child_process';
import { ProcessManagerAPI, ProcessManager } from '@/lib/process-manager';
import { resolveBinary, binaryExists } from '@/lib/binary-lookup';

jest.mock('child_process');
jest.mock('@/lib/binary-lookup');

describe('ProcessManager', () => {
  let mockChild: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockChild = {
      pid: 12345,
      unref: jest.fn(),
    };

    (spawn as jest.Mock).mockReturnValue(mockChild);
    (resolveBinary as jest.Mock).mockReturnValue('/path/to/model.bin');
    (binaryExists as jest.Mock).mockResolvedValue(true);

    ProcessManager['processes'].clear();
  });

  describe('start', () => {
    it('should start a model process', async () => {
      const result = await ProcessManager.start('test-model');

      expect(result).toEqual({
        pid: 12345,
        launchedAt: expect.any(Number),
        model: 'test-model',
      });
    });

    it('should spawn process with correct command', async () => {
      await ProcessManager.start('test-model');

      expect(spawn).toHaveBeenCalledWith(
        '/home/bamer/llama.cpp/build/bin/llama.cpp',
        expect.arrayContaining([
          '-m',
          '/path/to/model.bin',
          '-c',
          '2048',
          '-ngl',
          '0',
          '-p',
          expect.stringContaining('Hello'),
        ]),
        { detached: true, stdio: 'ignore' }
      );
    });

    it('should check if binary exists before spawning', async () => {
      await ProcessManager.start('test-model');

      expect(binaryExists).toHaveBeenCalledWith('test-model');
    });

    it('should resolve binary path', async () => {
      await ProcessManager.start('test-model');

      expect(resolveBinary).toHaveBeenCalledWith('test-model');
    });

    it('should call unref on child process', async () => {
      await ProcessManager.start('test-model');

      expect(mockChild.unref).toHaveBeenCalled();
    });

    it('should store process info', async () => {
      await ProcessManager.start('test-model');

      const info = ProcessManager.getInfo('test-model');
      expect(info).toEqual({
        pid: 12345,
        launchedAt: expect.any(Number),
        model: 'test-model',
      });
    });

    it('should return cached process if already running', async () => {
      const firstStart = await ProcessManager.start('test-model');
      const secondStart = await ProcessManager.start('test-model');

      expect(firstStart).toBe(secondStart);
      expect(spawn).toHaveBeenCalledTimes(1);
    });

    it('should set launchedAt timestamp', async () => {
      const beforeStart = Date.now();
      const result = await ProcessManager.start('test-model');
      const afterStart = Date.now();

      expect(result.launchedAt).toBeGreaterThanOrEqual(beforeStart);
      expect(result.launchedAt).toBeLessThanOrEqual(afterStart);
    });

    it('should handle multiple models', async () => {
      await ProcessManager.start('model1');
      await ProcessManager.start('model2');

      expect(spawn).toHaveBeenCalledTimes(2);
      expect(ProcessManager.getInfo('model1')).toBeDefined();
      expect(ProcessManager.getInfo('model2')).toBeDefined();
    });

    it('should reject if binary does not exist', async () => {
      (binaryExists as jest.Mock).mockResolvedValue(false);

      await expect(ProcessManager.start('non-existent-model')).rejects.toThrow();
    });
  });

  describe('stop', () => {
    beforeEach(async () => {
      await ProcessManager.start('test-model');
    });

    it('should stop a running process', () => {
      const mockKill = jest.fn();
      (process as any).kill = mockKill;

      const result = ProcessManager.stop('test-model');

      expect(result).toBe(true);
      expect(mockKill).toHaveBeenCalledWith(12345, 'SIGTERM');
      expect(ProcessManager.getInfo('test-model')).toBeUndefined();
    });

    it('should return false if process not found', () => {
      const result = ProcessManager.stop('non-existent-model');

      expect(result).toBe(false);
    });

    it('should remove process from tracking', () => {
      const mockKill = jest.fn();
      (process as any).kill = mockKill;

      ProcessManager.stop('test-model');

      expect(ProcessManager.getInfo('test-model')).toBeUndefined();
    });

    it('should handle kill errors gracefully', () => {
      const mockKill = jest.fn(() => {
        throw new Error('Process already exited');
      });
      (process as any).kill = mockKill;

      const result = ProcessManager.stop('test-model');

      expect(result).toBe(true);
      expect(ProcessManager.getInfo('test-model')).toBeUndefined();
    });
  });

  describe('getInfo', () => {
    it('should return process info for running model', async () => {
      await ProcessManager.start('test-model');

      const info = ProcessManager.getInfo('test-model');

      expect(info).toEqual({
        pid: 12345,
        launchedAt: expect.any(Number),
        model: 'test-model',
      });
    });

    it('should return undefined for non-existent model', () => {
      const info = ProcessManager.getInfo('non-existent-model');

      expect(info).toBeUndefined();
    });

    it('should return undefined when no processes running', () => {
      const info = ProcessManager.getInfo('any-model');

      expect(info).toBeUndefined();
    });
  });

  describe('ProcessManagerAPI', () => {
    it('should export start method', () => {
      expect(typeof ProcessManagerAPI.start).toBe('function');
    });

    it('should export stop method', () => {
      expect(typeof ProcessManagerAPI.stop).toBe('function');
    });

    it('should export getInfo method', () => {
      expect(typeof ProcessManagerAPI.getInfo).toBe('function');
    });

    it('should start process through API', async () => {
      const result = await ProcessManagerAPI.start('test-model');

      expect(result).toEqual({
        pid: 12345,
        launchedAt: expect.any(Number),
        model: 'test-model',
      });
    });

    it('should stop process through API', async () => {
      await ProcessManagerAPI.start('test-model');
      const mockKill = jest.fn();
      (process as any).kill = mockKill;

      const result = ProcessManagerAPI.stop('test-model');

      expect(result).toBe(true);
    });

    it('should get info through API', async () => {
      await ProcessManagerAPI.start('test-model');

      const info = ProcessManagerAPI.getInfo('test-model');

      expect(info).toEqual({
        pid: 12345,
        launchedAt: expect.any(Number),
        model: 'test-model',
      });
    });
  });

  describe('concurrent model management', () => {
    it('should track multiple models independently', async () => {
      const child1 = { pid: 11111, unref: jest.fn() };
      const child2 = { pid: 22222, unref: jest.fn() };

      (spawn as jest.Mock)
        .mockReturnValueOnce(child1)
        .mockReturnValueOnce(child2);

      await ProcessManagerAPI.start('model1');
      await ProcessManagerAPI.start('model2');

      const info1 = ProcessManagerAPI.getInfo('model1');
      const info2 = ProcessManagerAPI.getInfo('model2');

      expect(info1?.pid).toBe(11111);
      expect(info2?.pid).toBe(22222);
    });

    it('should stop specific model without affecting others', async () => {
      const child1 = { pid: 11111, unref: jest.fn() };
      const child2 = { pid: 22222, unref: jest.fn() };

      (spawn as jest.Mock)
        .mockReturnValueOnce(child1)
        .mockReturnValueOnce(child2);

      await ProcessManagerAPI.start('model1');
      await ProcessManagerAPI.start('model2');

      const mockKill = jest.fn();
      (process as any).kill = mockKill;

      ProcessManagerAPI.stop('model1');

      expect(ProcessManagerAPI.getInfo('model1')).toBeUndefined();
      expect(ProcessManagerAPI.getInfo('model2')).toBeDefined();
      expect(mockKill).toHaveBeenCalledWith(11111, 'SIGTERM');
    });
  });

  describe('edge cases', () => {
    it('should handle model names with special characters', async () => {
      await ProcessManager.start('model_123-test');

      expect(ProcessManager.getInfo('model_123-test')).toBeDefined();
    });

    it('should handle model names with numbers', async () => {
      await ProcessManager.start('model123');

      expect(ProcessManager.getInfo('model123')).toBeDefined();
    });

    it('should handle long model names', async () => {
      const longName = 'very-long-model-name-with-many-characters-12345';
      await ProcessManager.start(longName);

      expect(ProcessManager.getInfo(longName)).toBeDefined();
    });

    it('should handle process with no unref method', async () => {
      const childWithoutUnref = { pid: 12345 };
      (spawn as jest.Mock).mockReturnValue(childWithoutUnref);

      await ProcessManager.start('test-model');

      expect(ProcessManager.getInfo('test-model')).toBeDefined();
    });
  });
});
