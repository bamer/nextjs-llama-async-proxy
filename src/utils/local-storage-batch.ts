/**
 * Batch localStorage utility for non-blocking writes
 * Uses requestIdleCallback to defer writes to idle periods
 * Reduces main thread blocking from localStorage operations
 */

export type WritePriority = 'critical' | 'normal' | 'low';

interface QueuedWrite {
  key: string;
  value: string;
  priority: WritePriority;
  timestamp: number;
}

interface StorageBatchConfig {
  /** Maximum time to wait before flushing (ms) */
  maxDelay: number;
  /** Timeout for requestIdleCallback (ms) */
  idleTimeout: number;
  /** Maximum queue size before immediate flush */
  maxQueueSize: number;
  /** Enable debug logging */
  debug: boolean;
}

const DEFAULT_CONFIG: StorageBatchConfig = {
  maxDelay: 100, // Flush after 100ms max
  idleTimeout: 2000, // Wait up to 2s for idle period
  maxQueueSize: 50, // Immediate flush if queue is too large
  debug: false,
};

class LocalStorageBatch {
  private queue: Map<string, QueuedWrite> = new Map();
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;
  private isFlushing: boolean = false;
  private config: StorageBatchConfig;
  private isIdleCallbackSupported: boolean;

  constructor(config: Partial<StorageBatchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isIdleCallbackSupported = typeof window !== 'undefined' &&
      typeof window.requestIdleCallback !== 'undefined';

    if (this.config.debug) {
      console.log('[LocalStorageBatch] Initialized with config:', this.config);
    }
  }

  /**
   * Queue a write operation to be batched
   * @param key - localStorage key
   * @param value - value to store
   * @param priority - write priority (critical writes flush immediately)
   */
  setItem(key: string, value: string, priority: WritePriority = 'normal'): void {
    // Critical writes execute immediately but still track in queue
    if (priority === 'critical') {
      if (this.config.debug) {
        console.log(`[LocalStorageBatch] Critical write: ${key}`);
      }
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error(`[LocalStorageBatch] Critical write failed for ${key}:`, error);
        throw error;
      }
      return;
    }

    // Queue normal/low priority writes
    this.queue.set(key, {
      key,
      value,
      priority,
      timestamp: Date.now(),
    });

    if (this.config.debug) {
      console.log(`[LocalStorageBatch] Queued write: ${key} (priority: ${priority})`);
    }

    // Schedule flush
    this.scheduleFlush();
  }

  /**
   * Remove item from localStorage immediately
   * @param key - localStorage key to remove
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[LocalStorageBatch] Remove failed for ${key}:`, error);
    }
    // Also remove from queue if present
    this.queue.delete(key);
  }

  /**
   * Get item from localStorage (synchronous read)
   * @param key - localStorage key
   * @returns value or null
   */
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`[LocalStorageBatch] Get failed for ${key}:`, error);
      return null;
    }
  }

  /**
   * Schedule a flush operation
   */
  private scheduleFlush(): void {
    // Immediate flush if queue is too large
    if (this.queue.size >= this.config.maxQueueSize) {
      this.flush();
      return;
    }

    // Cancel existing timeout
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }

    // Schedule new flush
    this.flushTimeout = setTimeout(() => {
      this.flush();
    }, this.config.maxDelay);
  }

  /**
   * Flush all queued writes to localStorage
   */
  private flush(): void {
    if (this.isFlushing || this.queue.size === 0) {
      return;
    }

    this.isFlushing = true;

    if (this.config.debug) {
      console.log(`[LocalStorageBatch] Flushing ${this.queue.size} writes`);
    }

    const flushOperations = () => {
      try {
        // Process all queued writes
        const writes = Array.from(this.queue.values());

        // Sort by priority (low -> normal) to ensure more important data writes last
        writes.sort((a, b) => {
          const priorityOrder = { low: 0, normal: 1, critical: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        let successCount = 0;
        let failCount = 0;

        writes.forEach((write) => {
          try {
            localStorage.setItem(write.key, write.value);
            this.queue.delete(write.key);
            successCount++;
          } catch (error) {
            console.error(`[LocalStorageBatch] Write failed for ${write.key}:`, error);
            failCount++;
            // Remove from queue even if failed to prevent retries
            this.queue.delete(write.key);
          }
        });

        if (this.config.debug) {
          console.log(
            `[LocalStorageBatch] Flush complete: ${successCount} success, ${failCount} failed`
          );
        }
      } catch (error) {
        console.error('[LocalStorageBatch] Flush error:', error);
      } finally {
        this.isFlushing = false;
        this.flushTimeout = null;
      }
    };

    // Use requestIdleCallback if available for non-blocking writes
    if (this.isIdleCallbackSupported) {
      window.requestIdleCallback(
        () => {
          flushOperations();
        },
        { timeout: this.config.idleTimeout }
      );
    } else {
      // Fallback to immediate execution
      flushOperations();
    }
  }

  /**
   * Force immediate flush of all queued writes
   */
  forceFlush(): void {
    if (this.config.debug) {
      console.log('[LocalStorageBatch] Force flush requested');
    }
    this.flush();
  }

  /**
   * Clear all queued writes (without writing)
   */
  clearQueue(): void {
    this.queue.clear();
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    if (this.config.debug) {
      console.log('[LocalStorageBatch] Queue cleared');
    }
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.size;
  }

  /**
   * Get debug info about the batch system
   */
  getDebugInfo(): {
    queueSize: number;
    isFlushing: boolean;
    hasPendingFlush: boolean;
    writes: Array<{ key: string; priority: WritePriority; age: number }>;
  } {
    return {
      queueSize: this.queue.size,
      isFlushing: this.isFlushing,
      hasPendingFlush: this.flushTimeout !== null,
      writes: Array.from(this.queue.values()).map((w) => ({
        key: w.key,
        priority: w.priority,
        age: Date.now() - w.timestamp,
      })),
    };
  }
}

// Singleton instance
const batchStorage = new LocalStorageBatch({
  debug: process.env.NODE_ENV === 'development', // Enable logging in development
});

// Export convenience functions
export const setItem = (key: string, value: string, priority?: WritePriority): void =>
  batchStorage.setItem(key, value, priority);

export const getItem = (key: string): string | null => batchStorage.getItem(key);

export const removeItem = (key: string): void => batchStorage.removeItem(key);

export const setItemCritical = (key: string, value: string): void =>
  batchStorage.setItem(key, value, 'critical');

export const setItemLow = (key: string, value: string): void =>
  batchStorage.setItem(key, value, 'low');

export const forceFlush = (): void => batchStorage.forceFlush();

export const clearQueue = (): void => batchStorage.clearQueue();

export const getQueueSize = (): number => batchStorage.getQueueSize();

export const getDebugInfo = () => batchStorage.getDebugInfo();

// Export class for advanced usage
export { LocalStorageBatch, batchStorage };

// Default export
export default batchStorage;
