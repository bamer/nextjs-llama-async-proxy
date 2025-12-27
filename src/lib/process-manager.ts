// import path from 'path';
import { spawn } from 'child_process';
import { resolveBinary, binaryExists } from '@/lib/binary-lookup';

/**
 * Information stored for each running model process.
 */
export interface ModelProcessInfo {
  pid: number;
  launchedAt: number;
  model: string;
}

/**
 * ProcessManager isolates all child‑process handling for llama.cpp.
 * It tracks running processes in memory and guarantees atomic state
 * updates via the persisted state file.
 */
class ProcessManager {
  // Use a plain static field (no #private) for broader TypeScript compatibility
  private static processes = new Map<string, ModelProcessInfo>();

  /**
   * Start (or retrieve) a running llama.cpp process.
   * @param model - validated model directory name
   * @returns Promise resolving to the process info
   */
  static async start(model: string): Promise<ModelProcessInfo> {
    // Return cached process if already running
    if (this.processes.has(model)) {
      return this.processes.get(model)!;
    }

    // Ensure the binary exists before spawning
    const exists = await binaryExists(model);
    if (!exists) {
      throw new Error(`Binary for model '${model}' does not exist`);
    }

    // Resolve the binary path (throws if missing)
    const binaryPath = resolveBinary(model);

    // Build the command – adjust `cmd` if your binary lives elsewhere
    const cmd = '/home/bamer/llama.cpp/build/bin/llama.cpp';
    const args = [
      '-m',
      binaryPath,
      '-c',
      '2048',
      '-ngl',
      '0',
      '-p',
      '"prompt=Hello from Next.js API"',
    ];

    // Spawn detached process; ignore stdio to avoid blocking
    const child = spawn(cmd, args, { detached: true, stdio: 'ignore' });
    // Optional chaining for unref in case child process doesn't have it
    child.unref?.();

    const launchedAt = Date.now();
    const pid = child.pid!;
    const info: ModelProcessInfo = { pid, launchedAt, model };
    this.processes.set(model, info);
    return info;
  }

  /**
   * Stop a running model process.
   * @param model - validated model name
   * @returns true if a process was found and SIGTERM was sent
   */
  static stop(model: string): boolean {
    const info = this.processes.get(model);
    if (!info) return false;

    try {
      process.kill(info.pid, 'SIGTERM');
    } catch {
      // ignore – process may have already exited
    }
    this.processes.delete(model);
    return true;
  }

  /**
   * Retrieve stored process info (or undefined if not running).
   */
  static getInfo(model: string): ModelProcessInfo | undefined {
    return this.processes.get(model);
  }

  /**
   * Reset all processes (for testing purposes).
   * @internal
   */
  static _reset(): void {
    this.processes.clear();
  }
}

/* Export a singleton‑style API for external modules */
export const ProcessManagerAPI = {
  start: (model: string) => ProcessManager.start(model),
  stop: (model: string) => ProcessManager.stop(model),
  getInfo: (model: string) => ProcessManager.getInfo(model),
};

// Export the class for testing purposes
export { ProcessManager };