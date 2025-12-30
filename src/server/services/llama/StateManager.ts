import { getLogger } from "@/lib/logger";
import type {
  LlamaServiceState,
  LlamaServiceStatus,
} from "./types";

const logger = getLogger();

export class StateManager {
  private state: LlamaServiceState;
  private statusChangeCallbacks: ((state: LlamaServiceState) => void)[] = [];
  private uptimeInterval: NodeJS.Timer | null = null;

  constructor() {
    this.state = {
      status: "initial",
      models: [],
      lastError: null,
      retries: 0,
      uptime: 0,
      startedAt: null,
    };
  }

  /**
   * Register callback for state changes
   */
  onStateChange(callback: (state: LlamaServiceState) => void): void {
    this.statusChangeCallbacks.push(callback);
  }

  /**
   * Get current state
   */
  getState(): LlamaServiceState {
    return { ...this.state };
  }

  /**
   * Update internal state and emit changes
   */
  updateState(status: LlamaServiceStatus, error: string | null = null): void {
    this.state.status = status;
    if (error) {
      this.state.lastError = error;
    }
    if (status === "ready") {
      this.state.retries = 0;
    }
    this.emitStateChange();
  }

  /**
   * Update models list
   */
  updateModels(models: unknown[]): void {
    this.state.models = models;
    this.emitStateChange();
  }

  /**
   * Increment retry count
   */
  incrementRetries(): void {
    this.state.retries++;
  }

  /**
   * Reset retry count
   */
  resetRetries(): void {
    this.state.retries = 0;
  }

  /**
   * Get retry count
   */
  getRetries(): number {
    return this.state.retries;
  }

  /**
   * Get current status
   */
  getStatus(): LlamaServiceStatus {
    return this.state.status;
  }

  /**
   * Get last error
   */
  getLastError(): string | null {
    return this.state.lastError;
  }

  /**
   * Start tracking uptime (without emitting state changes)
   */
  startUptimeTracking(): void {
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval as NodeJS.Timeout);
    }

    this.state.startedAt = new Date();
    this.uptimeInterval = setInterval(() => {
      if (this.state.startedAt) {
        this.state.uptime = Math.floor(
          (Date.now() - this.state.startedAt.getTime()) / 1000
        );
      }
    }, 1000);
  }

  /**
   * Stop uptime tracking
   */
  stopUptimeTracking(): void {
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval as NodeJS.Timeout);
      this.uptimeInterval = null;
    }
  }

  /**
   * Reset state to initial
   */
  reset(): void {
    this.state = {
      status: "initial",
      models: [],
      lastError: null,
      retries: 0,
      uptime: 0,
      startedAt: null,
    };
    this.stopUptimeTracking();
    this.emitStateChange();
  }

  /**
   * Emit state change to callbacks
   */
  private emitStateChange(): void {
    this.statusChangeCallbacks.forEach((callback) => {
      try {
        callback(this.getState());
      } catch (error) {
        logger.error(`Error in state change callback: ${error}`);
      }
    });
  }
}
