import { LlamaServiceState, LlamaServiceStatus, LlamaModel } from "./types";
import { getLogger } from "@/lib/logger";

const logger = getLogger();

export class StateManager {
  private state: LlamaServiceState;
  private callbacks: ((state: LlamaServiceState) => void)[] = [];
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

  getState(): LlamaServiceState {
    return { ...this.state };
  }

  updateStatus(status: LlamaServiceStatus, error: string | null = null): void {
    this.state.status = status;
    if (error) {
      this.state.lastError = error;
    }
    if (status === "ready") {
      this.state.retries = 0;
    }
    this.emit();
  }

  setModels(models: LlamaModel[]): void {
    this.state.models = models;
    this.emit();
  }

  incrementRetries(): void {
    this.state.retries++;
    this.emit();
  }

  resetRetries(): void {
    this.state.retries = 0;
    this.emit();
  }

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
        this.emit();
      }
    }, 1000);
  }

  stopUptimeTracking(): void {
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval as NodeJS.Timeout);
      this.uptimeInterval = null;
    }
  }

  onStateChange(callback: (state: LlamaServiceState) => void): void {
    this.callbacks.push(callback);
  }

  private emit(): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(this.getState());
      } catch (error) {
        logger.error("Error in state change callback:", error);
      }
    });
  }
}
