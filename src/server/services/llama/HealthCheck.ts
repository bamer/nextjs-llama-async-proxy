import { getLogger } from "@/lib/logger";

const logger = getLogger();

export class HealthCheck {
  private maxHealthChecks = 60;
  private healthCheckIntervalMs = 1000;
  private healthCheckFn: () => Promise<boolean>;

  constructor(
    healthCheckFn: () => Promise<boolean>,
    maxHealthChecks?: number,
    healthCheckIntervalMs?: number
  ) {
    this.healthCheckFn = healthCheckFn;
    if (maxHealthChecks !== undefined) {
      this.maxHealthChecks = maxHealthChecks;
    }
    if (healthCheckIntervalMs !== undefined) {
      this.healthCheckIntervalMs = healthCheckIntervalMs;
    }
  }

  /**
   * Perform a single health check
   */
  async check(): Promise<boolean> {
    try {
      return await this.healthCheckFn();
    } catch {
      return false;
    }
  }

  /**
   * Wait for server to respond to health checks
   */
  async waitForReady(): Promise<void> {
    let attempts = 0;

    while (attempts < this.maxHealthChecks) {
      try {
        const isHealthy = await this.check();
        if (isHealthy) {
          logger.info(`✅ Server ready after ${attempts} checks`);
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
      `Llama server did not respond after ${this.maxHealthChecks * this.healthCheckIntervalMs / 1000}s`
    );
  }

  /**
   * Update health check configuration
   */
  updateConfig(maxHealthChecks?: number, intervalMs?: number): void {
    if (maxHealthChecks !== undefined) {
      this.maxHealthChecks = maxHealthChecks;
    }
    if (intervalMs !== undefined) {
      this.healthCheckIntervalMs = intervalMs;
    }
  }
}
