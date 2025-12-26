import axios, { AxiosInstance } from "axios";

export class HealthChecker {
  private client: AxiosInstance;
  private healthCheckTimeoutMs: number;
  private healthCheckIntervalMs: number;
  private maxHealthChecks: number;

  constructor(
    host: string,
    port: number,
    timeoutMs: number = 5000,
    intervalMs: number = 1000,
    maxChecks: number = 60
  ) {
    this.healthCheckTimeoutMs = timeoutMs;
    this.healthCheckIntervalMs = intervalMs;
    this.maxHealthChecks = maxChecks;

    this.client = axios.create({
      baseURL: `http://${host}:${port}`,
      timeout: this.healthCheckTimeoutMs,
      validateStatus: () => true,
    });
  }

  async check(): Promise<boolean> {
    try {
      const response = await this.client.get("/health");
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async waitForReady(): Promise<void> {
    let attempts = 0;

    while (attempts < this.maxHealthChecks) {
      try {
        const isHealthy = await this.check();
        if (isHealthy) {
          return;
        }
      } catch {
        // Expected during startup
      }

      attempts++;
      await new Promise((resolve) =>
        setTimeout(resolve, this.healthCheckIntervalMs)
      );
    }

    throw new Error(
      `Server did not respond after ${(this.maxHealthChecks * this.healthCheckIntervalMs) / 1000}s`
    );
  }
}
