import { spawn, ChildProcess } from "child_process";

export class ProcessManager {
  private process: ChildProcess | null = null;

  getProcess(): ChildProcess | null {
    return this.process;
  }

  isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }

  spawn(binary: string, args: string[]): ChildProcess {
    this.process = spawn(binary, args, {
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    });
    return this.process;
  }

  async kill(signal: string = "SIGTERM", timeout: number = 5000): Promise<void> {
    if (!this.process) {
      return;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        this.process?.kill("SIGKILL");
        this.process = null;
        resolve();
      }, timeout);

      this.process.on("exit", () => {
        clearTimeout(timeoutId);
        this.process = null;
        resolve();
      });

      this.process.kill(signal);
    });
  }

  onData(
    callback: (data: string) => void,
    stream: "stdout" | "stderr" = "stdout"
  ): void {
    if (!this.process) return;

    const dataStream = stream === "stdout" ? this.process.stdout : this.process.stderr;
    dataStream?.on("data", (data) => {
      const message = data.toString().trim();
      if (message) {
        callback(message);
      }
    });
  }

  onError(callback: (error: Error) => void): void {
    if (!this.process) return;
    this.process.on("error", callback);
  }

  onExit(callback: (code: number | null, signal: string | null) => void): void {
    if (!this.process) return;
    this.process.on("exit", (code, signal) => {
      callback(code, signal);
    });
  }
}
