import { ProcessManager } from '@/server/services/llama/processManager';
import { spawn, ChildProcess } from 'child_process';

jest.mock('child_process');
const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

describe('ProcessManager', () => {
  let processManager: ProcessManager;
  let mockChildProcess: Partial<ChildProcess>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockChildProcess = {
      kill: jest.fn(),
      on: jest.fn(),
      stdout: {
        on: jest.fn(),
      },
      stderr: {
        on: jest.fn(),
      },
    };

    mockSpawn.mockReturnValue(mockChildProcess as ChildProcess);
    processManager = new ProcessManager();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with no process', () => {
      expect(processManager.isRunning()).toBe(false);
    });

    it('should have undefined process initially', () => {
      expect(processManager.getProcess()).toBeUndefined();
    });
  });

  describe('spawnProcess', () => {
    it('should spawn process with command and args', () => {
      const command = 'llama-server';
      const args = ['-m', 'model.gguf'];

      processManager.spawnProcess(command, args);

      expect(mockSpawn).toHaveBeenCalledWith(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      });
    });

    it('should store process reference', () => {
      processManager.spawnProcess('test', []);

      expect(processManager.getProcess()).toBeDefined();
    });

    it('should return true for isRunning after spawn', () => {
      processManager.spawnProcess('test', []);

      expect(processManager.isRunning()).toBe(true);
    });

    it('should allow multiple spawns (last one wins)', () => {
      processManager.spawnProcess('test1', []);
      const process1 = processManager.getProcess();

      processManager.spawnProcess('test2', []);
      const process2 = processManager.getProcess();

      expect(process1).not.toBe(process2);
      expect(processManager.isRunning()).toBe(true);
    });
  });

  describe('onData', () => {
    it('should register stdout data handler', () => {
      const handler = jest.fn();

      processManager.spawnProcess('test', []);
      processManager.onData(handler, 'stdout');

      expect(mockChildProcess.stdout?.on).toHaveBeenCalledWith('data', handler);
    });

    it('should register stderr data handler', () => {
      const handler = jest.fn();

      processManager.spawnProcess('test', []);
      processManager.onData(handler, 'stderr');

      expect(mockChildProcess.stderr?.on).toHaveBeenCalledWith('data', handler);
    });

    it('should support multiple data handlers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      processManager.spawnProcess('test', []);
      processManager.onData(handler1, 'stdout');
      processManager.onData(handler2, 'stderr');

      expect(mockChildProcess.stdout?.on).toHaveBeenCalledWith('data', handler1);
      expect(mockChildProcess.stderr?.on).toHaveBeenCalledWith('data', handler2);
    });
  });

  describe('onError', () => {
    it('should register error handler', () => {
      const handler = jest.fn();

      processManager.spawnProcess('test', []);
      processManager.onError(handler);

      expect(mockChildProcess.on).toHaveBeenCalledWith('error', handler);
    });

    it('should handle process errors', () => {
      const errorHandler = jest.fn();
      const processError = new Error('Process failed');

      processManager.spawnProcess('test', []);
      processManager.onError(errorHandler);

      const onCalls = (mockChildProcess.on as jest.Mock).mock.calls;
      const errorCall = onCalls.find(call => call[0] === 'error');
      if (errorCall && errorCall[1]) {
        errorCall[1](processError);
      }

      expect(errorHandler).toHaveBeenCalledWith(processError);
    });
  });

  describe('onExit', () => {
    it('should register exit handler', () => {
      const handler = jest.fn();

      processManager.spawnProcess('test', []);
      processManager.onExit(handler);

      expect(mockChildProcess.on).toHaveBeenCalledWith('exit', handler);
    });

    it('should pass exit code and signal to handler', () => {
      const handler = jest.fn();

      processManager.spawnProcess('test', []);
      processManager.onExit(handler);

      const onCalls = (mockChildProcess.on as jest.Mock).mock.calls;
      const exitCall = onCalls.find(call => call[0] === 'exit');
      if (exitCall && exitCall[1]) {
        exitCall[1](123, 'SIGTERM');
      }

      expect(handler).toHaveBeenCalledWith(123, 'SIGTERM');
    });
  });

  describe('isRunning', () => {
    it('should return false when no process', () => {
      expect(processManager.isRunning()).toBe(false);
    });

    it('should return true when process spawned', () => {
      processManager.spawnProcess('test', []);

      expect(processManager.isRunning()).toBe(true);
    });

    it('should return false after kill', () => {
      processManager.spawnProcess('test', []);

      processManager.kill('SIGTERM');

      expect(processManager.isRunning()).toBe(false);
    });
  });

  describe('getProcess', () => {
    it('should return undefined when no process', () => {
      expect(processManager.getProcess()).toBeUndefined();
    });

    it('should return process reference after spawn', () => {
      processManager.spawnProcess('test', []);
      const proc = processManager.getProcess();

      expect(proc).toBe(mockChildProcess);
    });
  });

  describe('kill', () => {
    it('should send SIGTERM signal', () => {
      processManager.spawnProcess('test', []);

      processManager.kill('SIGTERM');

      expect(mockChildProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should clear process reference after kill', () => {
      processManager.spawnProcess('test', []);

      processManager.kill('SIGTERM');

      expect(processManager.isRunning()).toBe(false);
      expect(processManager.getProcess()).toBeUndefined();
    });

    it('should send different signals', () => {
      processManager.spawnProcess('test', []);

      processManager.kill('SIGKILL');

      expect(mockChildProcess.kill).toHaveBeenCalledWith('SIGKILL');
    });

    it('should be safe to call kill multiple times', () => {
      processManager.spawnProcess('test', []);

      processManager.kill('SIGTERM');
      processManager.kill('SIGTERM');

      expect(mockChildProcess.kill).toHaveBeenCalledTimes(2);
    });
  });
});
