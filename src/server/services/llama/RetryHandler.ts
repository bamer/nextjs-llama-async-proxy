import { getLogger } from "@/lib/logger";

const logger = getLogger();

export class RetryHandler {
  private maxRetries = 5;
  private retryBackoffMs = 1000;
  private maxRetryWait = 30000;

  constructor(maxRetries?: number, retryBackoffMs?: number, maxRetryWait?: number) {
    if (maxRetries !== undefined) {
      this.maxRetries = maxRetries;
    }
    if (retryBackoffMs !== undefined) {
      this.retryBackoffMs = retryBackoffMs;
    }
    if (maxRetryWait !== undefined) {
      this.maxRetryWait = maxRetryWait;
    }
  }

  /**
   * Handle retry with exponential backoff
   */
  async retry(
    currentRetries: number,
    retryFn: () => Promise<void>,
    onFailure?: () => void
  ): Promise<void> {
    if (currentRetries >= this.maxRetries) {
      logger.error(
        `❌ Max retries (${this.maxRetries}) exceeded. Giving up.`
      );
      if (onFailure) {
        onFailure();
      }
      return;
    }

    const retryCount = currentRetries + 1;
    const delayMs = Math.min(
      this.retryBackoffMs * Math.pow(2, currentRetries),
      this.maxRetryWait
    );

    logger.info(
      `🔄 Retry ${retryCount}/${this.maxRetries} in ${delayMs / 1000}s`
    );

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    try {
      await retryFn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Retry failed: ${message}`);
      // Recursively retry
      await this.retry(retryCount, retryFn, onFailure);
    }
  }

  /**
   * Get max retries
   */
  getMaxRetries(): number {
    return this.maxRetries;
  }

  /**
   * Check if should retry
   */
  shouldRetry(currentRetries: number): boolean {
    return currentRetries < this.maxRetries;
  }

  /**
   * Calculate delay for next retry
   */
  calculateDelay(retryCount: number): number {
    return Math.min(
      this.retryBackoffMs * Math.pow(2, retryCount),
      this.maxRetryWait
    );
  }

  /**
   * Update retry configuration
   */
  updateConfig(maxRetries?: number, retryBackoffMs?: number, maxRetryWait?: number): void {
    if (maxRetries !== undefined) {
      this.maxRetries = maxRetries;
    }
    if (retryBackoffMs !== undefined) {
      this.retryBackoffMs = retryBackoffMs;
    }
    if (maxRetryWait !== undefined) {
      this.maxRetryWait = maxRetryWait;
    }
  }
}
