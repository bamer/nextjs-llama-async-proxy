export class RetryHandler {
  private maxRetries: number;
  private initialBackoffMs: number;
  private maxBackoffMs: number;

  constructor(
    maxRetries: number = 5,
    initialBackoffMs: number = 1000,
    maxBackoffMs: number = 30000
  ) {
    this.maxRetries = maxRetries;
    this.initialBackoffMs = initialBackoffMs;
    this.maxBackoffMs = maxBackoffMs;
  }

  canRetry(retries: number): boolean {
    return retries < this.maxRetries;
  }

  getBackoffMs(retries: number): number {
    const backoff = this.initialBackoffMs * Math.pow(2, retries);
    return Math.min(backoff, this.maxBackoffMs);
  }

  async waitForRetry(retries: number): Promise<void> {
    const delayMs = this.getBackoffMs(retries);
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
