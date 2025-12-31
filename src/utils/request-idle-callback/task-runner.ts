/**
 * Task execution utilities for idle periods
 * Provides sequential task execution with idle checks
 */

import { RequestIdleCallbackOptions } from './types';
import { requestIdleCallbackPromise } from './callback-promise';

/**
 * Execute multiple tasks in idle periods
 * Tasks are executed one at a time, with idle checks between each
 *
 * @param tasks - Array of tasks to execute
 * @param options - Options including timeout per task
 * @returns Promise that resolves when all tasks are complete
 */
export function runTasksInIdle<T>(
  tasks: Array<() => T | Promise<T>>,
  options?: RequestIdleCallbackOptions
): Promise<T[]> {
  return new Promise<T[]>((resolve, reject) => {
    const results: T[] = [];
    let currentIndex = 0;

    const executeNext = async (): Promise<void> => {
      if (currentIndex >= tasks.length) {
        resolve(results);
        return;
      }

      try {
        const result = await tasks[currentIndex]();
        results.push(result);
        currentIndex++;
        await requestIdleCallbackPromise(executeNext, options);
      } catch (error) {
        reject(error);
      }
    };

    requestIdleCallbackPromise(executeNext, options);
  });
}

/**
 * Execute tasks in batches during idle periods
 *
 * @param tasks - Array of tasks to execute
 * @param batchSize - Number of tasks per batch
 * @param options - Options including timeout per batch
 * @returns Promise that resolves when all tasks are complete
 */
export function runTasksInBatches<T>(
  tasks: Array<() => T | Promise<T>>,
  batchSize: number = 5,
  options?: RequestIdleCallbackOptions
): Promise<T[]> {
  return new Promise<T[]>((resolve, reject) => {
    const results: T[] = [];
    let currentIndex = 0;

    const executeBatch = async (): Promise<void> => {
      if (currentIndex >= tasks.length) {
        resolve(results);
        return;
      }

      try {
        const batch = tasks.slice(currentIndex, currentIndex + batchSize);
        const batchResults = await Promise.all(batch.map((task) => task()));
        results.push(...batchResults);
        currentIndex += batchSize;
        await requestIdleCallbackPromise(executeBatch, options);
      } catch (error) {
        reject(error);
      }
    };

    requestIdleCallbackPromise(executeBatch, options);
  });
}
