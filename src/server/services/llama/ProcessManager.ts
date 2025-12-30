import type { ChildProcess } from "child_process";
import { spawn } from "child_process";
import { getLogger } from "@/lib/logger";
import { buildArgs } from "./ArgumentBuilder";
import type { LlamaServerConfig } from "./types";

const logger = getLogger();

export class ProcessManager {
  private process: ChildProcess | null = null;
  private config: LlamaServerConfig;

  constructor(config: LlamaServerConfig) {
    this.config = config;
  }

  /**
   * Spawn new llama-server process
   */
  async spawnServer(
    onReady: () => Promise<void>,
    onError: (error: Error) => void,
    onExit: (code: number | null, signal: NodeJS.Signals | null) => void
  ): Promise<void> {
    const args = buildArgs(this.config);
    const serverBinary = this.config.serverPath || "llama-server";
    logger.info(
      `🚀 Spawning ${serverBinary} with args: ${args.join(" ")}`
    );

    this.process = spawn(serverBinary, args, {
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    });

    // Handle process errors
    this.process.on("error", (error) => {
      logger.error(`Process error: ${error.message}`);
      onError(error);
    });

    // Handle process exit
    this.process.on("exit", (code, signal) => {
      logger.warn(`Process exited with code ${code} signal ${signal}`);
      onExit(code, signal);
    });

    // Log stdout
    this.process.stdout?.on("data", (data) => {
      const message = data.toString().trim();
      if (message) {
        logger.debug(`[llama-server] ${message}`);
      }
    });

    // Log stderr
    this.process.stderr?.on("data", (data) => {
      const message = data.toString().trim();
      if (message) {
        logger.warn(`[llama-server-err] ${message}`);
      }
    });

    // Wait for server to be ready
    await onReady();
  }

  /**
   * Stop the process gracefully
   */
  async stop(): Promise<void> {
    logger.info("🛑 Stopping llama server...");

    if (this.process) {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          logger.warn("⏱️ Force killing llama server process");
          this.process?.kill("SIGKILL");
          this.process = null;
          resolve();
        }, 5000);

        this.process!.on("exit", () => {
          clearTimeout(timeout);
          logger.info("✅ Llama server stopped");
          this.process = null;
          resolve();
        });

        this.process!.kill("SIGTERM");
      });
    }
  }

  /**
   * Check if process is running
   */
  isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }
}
