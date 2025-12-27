import { spawn, ChildProcess } from 'child_process';
import { ProcessManager } from '@/server/services/llama/processManager';

jest.mock('child_process');

const mockedSpawn = spawn as jest.MockedFunction<typeof spawn>;

describe('ProcessManager', () => {
  let processManager: ProcessManager;
  let mockProcess: Partial<ChildProcess>;

  beforeEach(() => {
    jest.clearAllMocks();
    processManager = new ProcessManager();

    mockProcess = {
      pid: 12345,
      killed: false,
      kill: jest.fn(),
      on: jest.fn((event: string, callback: any) => {
        if ((mockProcess as any).listeners === undefined) {
          (mockProcess as any).listeners = new Map<string, any[]>();
        }
        if (!(mockProcess as any).listeners.has(event)) {
          (mockProcess as any).listeners.set(event, []);
        }
        (mockProcess as any).listeners.get(event).push(callback);
      }),
      stdout: {
        on: jest.fn(),
      },
      stderr: {
        on: jest.fn(),
      },
    };

    mockedSpawn.mockReturnValue(mockProcess as ChildProcess);
  });

  describe('getProcess', () => {
    it('should return null when no process is spawned', () => {
      const process = processManager.getProcess();

      expect(process).toBeNull();
    });

    it('should return spawned process', () => {
      processManager.spawn('test-binary', ['--arg1', '--arg2']);
      const process = processManager.getProcess();

      expect(process).toBe(mockProcess);
      expect(process?.pid).toBe(12345);
    });
  });

  describe('isRunning', () => {
    it('should return false when no process is spawned', () => {
      const running = processManager.isRunning();

      expect(running).toBe(false);
    });

    it('should return true when process is running', () => {
      processManager.spawn('test-binary', []);
      const running = processManager.isRunning();

      expect(running).toBe(true);
    });

    it('should return false when process is killed', () => {
      processManager.spawn('test-binary', []);
      (mockProcess.killed as any) = true;

      const running = processManager.isRunning();

      expect(running).toBe(false);
    });
  });

  describe('spawn', () => {
    it('should spawn a process with correct arguments', () => {
      const result = processManager.spawn('llama-server', ['--port', '8080', '--host', '0.0.0.0']);

      expect(mockedSpawn).toHaveBeenCalledWith('llama-server', ['--port', '8080', '--host', '0.0.0.0'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      });
      expect(result).toBe(mockProcess);
    });

    it('should store spawned process', () => {
      processManager.spawn('test-binary', []);

      expect(processManager.getProcess()).toBe(mockProcess);
    });

    it('should override existing process', () => {
      const firstProcess = processManager.spawn('first-binary', []);
      processManager.spawn('second-binary', []);

      expect(processManager.getProcess()).toBe(firstProcess);
    });

    it('should spawn with empty args', () => {
      processManager.spawn('test-binary', []);

      expect(mockedSpawn).toHaveBeenCalledWith('test-binary', [], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      });
    });
  });

  describe('kill', () => {
    it('should return immediately when no process is running', async () => {
      await expect(processManager.kill()).resolves.not.toThrow();
      expect(mockProcess.kill).not.toHaveBeenCalled();
    });

    it('should kill process with SIGTERM by default', async () => {
      processManager.spawn('test-binary', []);

      let exitCallback: ((code: number | null, signal: string | null) => void) | null = null;
      mockProcess.on = jest.fn((event: string, callback: any) => {
        if (event === 'exit') {
          exitCallback = callback;
        }
      });

      const killPromise = processManager.kill('SIGTERM');

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');

      if (exitCallback) {
        exitCallback(0, 'SIGTERM');
      }

      await killPromise;
    });

    it('should clear process after successful kill', async () => {
      processManager.spawn('test-binary', []);

      let exitCallback: ((code: number | null, signal: string | null) => void) | null = null;
      mockProcess.on = jest.fn((event: string, callback: any) => {
        if (event === 'exit') {
          exitCallback = callback;
        }
      });

      const killPromise = processManager.kill('SIGTERM');

      if (exitCallback) {
        exitCallback(0, 'SIGTERM');
      }

      await killPromise;

      expect(processManager.getProcess()).toBeNull();
    });

    it('should force kill with SIGKILL after timeout', async () => {
      jest.useFakeTimers();

      processManager.spawn('test-binary', []);

      mockProcess.on = jest.fn((event: string, callback: any) => {
        if (event === 'exit') {
        }
      });

      const killPromise = processManager.kill('SIGTERM', 5000);

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');

      jest.advanceTimersByTime(5000);

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGKILL');

      await killPromise;

      jest.useRealTimers();
    });

    it('should use custom timeout', async () => {
      jest.useFakeTimers();

      processManager.spawn('test-binary', []);

      mockProcess.on = jest.fn(() => {});

      const killPromise = processManager.kill('SIGTERM', 2000);

      jest.advanceTimersByTime(2000);

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGKILL');

      await killPromise;

      jest.useRealTimers();
    });

    it('should handle multiple kill calls', async () => {
      processManager.spawn('test-binary', []);

      let exitCallback: ((code: number | null, signal: string | null) => void) | null = null;
      mockProcess.on = jest.fn((event: string, callback: any) => {
        if (event === 'exit') {
          exitCallback = callback;
        }
      });

      const killPromise1 = processManager.kill();
      const killPromise2 = processManager.kill();

      // Both kill calls should trigger kill (no guard in implementation)
      expect(mockProcess.kill).toHaveBeenCalledTimes(2);
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');

      // Trigger exit to resolve both promises
      if (exitCallback) {
        exitCallback(0, 'SIGTERM');
      }

      await Promise.all([killPromise1, killPromise2]);

      // Both promises should resolve
      expect(mockProcess.kill).toHaveBeenCalledTimes(2);
    });

    it('should handle exit with signal', async () => {
      processManager.spawn('test-binary', []);

      let exitCallback: ((code: number | null, signal: string | null) => void) | null = null;
      mockProcess.on = jest.fn((event: string, callback: any) => {
        if (event === 'exit') {
          exitCallback = callback;
        }
      });

      const killPromise = processManager.kill();

      if (exitCallback) {
        exitCallback(null, 'SIGKILL');
      }

      await killPromise;

      expect(processManager.getProcess()).toBeNull();
    });
  });

  describe('onData', () => {
    it('should not call callback when no process', () => {
      const callback = jest.fn();

      processManager.onData(callback);

      expect(callback).not.toHaveBeenCalled();
      expect(mockProcess.stdout?.on).not.toHaveBeenCalled();
    });

    it('should register stdout data callback', () => {
      processManager.spawn('test-binary', []);
      const callback = jest.fn();

      processManager.onData(callback, 'stdout');

      expect(mockProcess.stdout?.on).toHaveBeenCalledWith('data', expect.any(Function));
    });

    it('should register stderr data callback', () => {
      processManager.spawn('test-binary', []);
      const callback = jest.fn();

      processManager.onData(callback, 'stderr');

      expect(mockProcess.stderr?.on).toHaveBeenCalledWith('data', expect.any(Function));
    });

    it('should call callback with data', () => {
      processManager.spawn('test-binary', []);
      const callback = jest.fn();

      let dataCallback: ((data: Buffer) => void) | null = null;
      mockProcess.stdout!.on = jest.fn((event: string, callback: any) => {
        if (event === 'data') {
          dataCallback = callback;
        }
      });

      processManager.onData(callback, 'stdout');

      if (dataCallback) {
        dataCallback(Buffer.from('test message'));
      }

      expect(callback).toHaveBeenCalledWith('test message');
    });

    it('should trim whitespace from data', () => {
      processManager.spawn('test-binary', []);
      const callback = jest.fn();

      let dataCallback: ((data: Buffer) => void) | null = null;
      mockProcess.stdout!.on = jest.fn((event: string, callback: any) => {
        if (event === 'data') {
          dataCallback = callback;
        }
      });

      processManager.onData(callback, 'stdout');

      if (dataCallback) {
        dataCallback(Buffer.from('  test message  \n'));
      }

      expect(callback).toHaveBeenCalledWith('test message');
    });

    it('should not call callback for empty data', () => {
      processManager.spawn('test-binary', []);
      const callback = jest.fn();

      let dataCallback: ((data: Buffer) => void) | null = null;
      mockProcess.stdout!.on = jest.fn((event: string, callback: any) => {
        if (event === 'data') {
          dataCallback = callback;
        }
      });

      processManager.onData(callback, 'stdout');

      if (dataCallback) {
        dataCallback(Buffer.from('   '));
      }

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('onError', () => {
    it('should not register when no process', () => {
      const callback = jest.fn();

      processManager.onError(callback);

      expect(mockProcess.on).not.toHaveBeenCalled();
    });

    it('should register error callback', () => {
      processManager.spawn('test-binary', []);
      const callback = jest.fn();

      processManager.onError(callback);

      expect(mockProcess.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('onExit', () => {
    it('should not register when no process', () => {
      const callback = jest.fn();

      processManager.onExit(callback);

      expect(mockProcess.on).not.toHaveBeenCalled();
    });

    it('should register exit callback', () => {
      processManager.spawn('test-binary', []);
      const callback = jest.fn();

      processManager.onExit(callback);

      expect(mockProcess.on).toHaveBeenCalledWith('exit', expect.any(Function));
    });

    it('should call callback with code and signal', () => {
      processManager.spawn('test-binary', []);
      const callback = jest.fn();

      let exitCallback: ((code: number | null, signal: string | null) => void) | null = null;
      mockProcess.on = jest.fn((event: string, callback: any) => {
        if (event === 'exit') {
          exitCallback = callback;
        }
      });

      processManager.onExit(callback);

      if (exitCallback) {
        exitCallback(0, 'SIGTERM');
      }

      expect(callback).toHaveBeenCalledWith(0, 'SIGTERM');
    });
  });
});
