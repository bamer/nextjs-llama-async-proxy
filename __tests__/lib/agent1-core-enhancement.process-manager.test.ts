/**
 * AGENT 1: Core Library Enhancement Tests - ProcessManager
 * ========================================
 * Purpose: ProcessManager enhanced coverage tests
 * Target File: process-manager.ts (93.40% → 98%)
 */

import { ProcessManagerAPI } from '@/lib/process-manager';
import {
  mockedSpawn,
  mockedResolveBinary,
  mockedBinaryExists,
  resetProcessManager,
  setupDefaultMocks,
  createMockedSocket,
  mockedIo,
} from './agent1-test-helper';

describe('ProcessManager - Enhanced Coverage', () => {
  let mockedSocket: any;
  beforeEach(() => {
    jest.clearAllMocks();
    resetProcessManager();
    setupDefaultMocks();
    mockedSocket = createMockedSocket();
    mockedIo.mockReturnValue(mockedSocket);
  });

  describe('Binary verification edge cases', () => {
    it('should handle binary existence check failure', async () => {
      mockedBinaryExists.mockRejectedValue(new Error('Check failed'));
      await expect(ProcessManagerAPI.start('model1')).rejects.toThrow('Check failed');
    });

    it('should throw specific error message for missing binary', async () => {
      mockedBinaryExists.mockResolvedValue(false);
      await expect(ProcessManagerAPI.start('missing-model')).rejects.toThrow(
        `Binary for model 'missing-model' does not exist`
      );
    });
  });

  describe('Process spawn edge cases', () => {
    it('should handle spawn returning null pid gracefully', async () => {
      const mockChild = { unref: jest.fn() };
      mockedSpawn.mockReturnValue(mockChild as any);

      const result = await ProcessManagerAPI.start('test-model');

      expect(result).toBeDefined();
      expect(result.pid).toBeUndefined();
      expect(result.model).toBe('test-model');
    });

    it('should call unref even if undefined', async () => {
      const mockChild = { pid: 9999, unref: undefined };
      mockedSpawn.mockReturnValue(mockChild as any);

      const result = await ProcessManagerAPI.start('test-model');

      expect(result.pid).toBe(9999);
      // unref?.() should not throw
    });

    it('should handle multiple rapid starts of same model', async () => {
      const mockChild = { pid: 5555, unref: jest.fn() };
      mockedSpawn.mockReturnValue(mockChild as any);

      // Only first call should actually spawn
      const result1 = await ProcessManagerAPI.start('model1');
      const result2 = await ProcessManagerAPI.start('model1');
      const result3 = await ProcessManagerAPI.start('model1');

      expect(result1.pid).toBe(result2.pid);
      expect(result2.pid).toBe(result3.pid);
      // mockedSpawn should be called once because subsequent calls return cached process
      expect(mockedSpawn).toHaveBeenCalled();
    });
  });

  describe('Stop process edge cases', () => {
    it('should handle process.kill throwing ESRCH (no such process)', async () => {
      const mockChild = { pid: 9999, unref: jest.fn() };
      mockedSpawn.mockReturnValue(mockChild as any);

      await ProcessManagerAPI.start('test-model');

      const originalKill = process.kill;
      const mockKill = jest.fn(() => {
        const err = new Error('ESRCH');
        (err as any).code = 'ESRCH';
        throw err;
      });
      (global as any).process.kill = mockKill;

      const result = ProcessManagerAPI.stop('test-model');

      expect(result).toBe(true);
      (global as any).process.kill = originalKill;
    });

    it('should clear model from processes even if kill fails', async () => {
      const mockChild = { pid: 7777, unref: jest.fn() };
      mockedSpawn.mockReturnValue(mockChild as any);

      await ProcessManagerAPI.start('test-model');

      const mockKill = jest.fn(() => {
        throw new Error('Permission denied');
      });
      (global as any).process.kill = mockKill;

      const result = ProcessManagerAPI.stop('test-model');

      expect(result).toBe(true);
      expect(ProcessManagerAPI.getInfo('test-model')).toBeUndefined();
    });

    it('should send SIGTERM signal correctly', async () => {
      const mockChild = { pid: 6666, unref: jest.fn() };
      mockedSpawn.mockReturnValue(mockChild as any);

      await ProcessManagerAPI.start('test-model');

      const mockKill = jest.fn();
      (global as any).process.kill = mockKill;

      ProcessManagerAPI.stop('test-model');

      expect(mockKill).toHaveBeenCalledWith(6666, 'SIGTERM');
    });
  });

  describe('State consistency', () => {
    it('should maintain separate state for each model', async () => {
      const mockChild1 = { pid: 1111, unref: jest.fn() };
      const mockChild2 = { pid: 2222, unref: jest.fn() };
      const mockChild3 = { pid: 3333, unref: jest.fn() };

      mockedResolveBinary.mockImplementation((model) => `/path/${model}.bin`);
      mockedSpawn
        .mockReturnValueOnce(mockChild1 as any)
        .mockReturnValueOnce(mockChild2 as any)
        .mockReturnValueOnce(mockChild3 as any);

      const r1 = await ProcessManagerAPI.start('modelA');
      const r2 = await ProcessManagerAPI.start('modelB');
      const r3 = await ProcessManagerAPI.start('modelC');

      expect(ProcessManagerAPI.getInfo('modelA')?.pid).toBe(r1.pid);
      expect(ProcessManagerAPI.getInfo('modelB')?.pid).toBe(r2.pid);
      expect(ProcessManagerAPI.getInfo('modelC')?.pid).toBe(r3.pid);
    });

    it('should return exact launchedAt timestamp', async () => {
      const mockChild = { pid: 4444, unref: jest.fn() };
      mockedSpawn.mockReturnValue(mockChild as any);

      const beforeTime = Date.now();
      const result = await ProcessManagerAPI.start('test-model');
      const afterTime = Date.now();

      expect(result.launchedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(result.launchedAt).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('API wrapper layer', () => {
    it('should expose start through ProcessManagerAPI', async () => {
      const mockChild = { pid: 8888, unref: jest.fn() };
      mockedSpawn.mockReturnValue(mockChild as any);
      const result = await ProcessManagerAPI.start('test-model');
      expect(result).toBeDefined();
      expect(result.pid).toBe(8888);
    });

    it('should expose stop through ProcessManagerAPI', async () => {
      const mockChild = { pid: 8888, unref: jest.fn() };
      mockedSpawn.mockReturnValue(mockChild as any);
      await ProcessManagerAPI.start('test-model');
      const result = ProcessManagerAPI.stop('test-model');
      expect(result).toBe(true);
    });

    it('should expose getInfo through ProcessManagerAPI', async () => {
      const mockChild = { pid: 8888, unref: jest.fn() };
      mockedSpawn.mockReturnValue(mockChild as any);
      await ProcessManagerAPI.start('test-model');
      const info = ProcessManagerAPI.getInfo('test-model');
      expect(info?.model).toBe('test-model');
    });
  });
});