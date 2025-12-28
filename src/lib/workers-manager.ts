"use client";

class WorkersManager {
  private static workers: Map<string, Worker> = new Map();

  static getWorker(name: string): Worker {
    if (!this.workers.has(name)) {
      let workerUrl: string;

      // Handle different environments
      if (typeof window !== "undefined") {
        // Browser environment
        workerUrl = new URL(`../workers/${name}.worker.ts`, import.meta.url)
          .href;
      } else {
        // Node.js/server environment
        workerUrl = require(`./workers/${name}.worker.ts`);
      }

      const worker = new Worker(workerUrl);
      this.workers.set(name, worker);
    }

    return this.workers.get(name)!;
  }

  static terminateWorker(name: string): void {
    const worker = this.workers.get(name);
    if (worker) {
      worker.terminate();
      this.workers.delete(name);
    }
  }

  static terminateAll(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers.clear();
  }
}

export { WorkersManager };
