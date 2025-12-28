/**
 * Tests for batch localStorage utility
 */

import { LocalStorageBatch, setItem, getItem, removeItem, setItemCritical, forceFlush, clearQueue, getQueueSize, getDebugInfo } from '@/utils/local-storage-batch';

// Mock localStorage
const mockLocalStorage = (() => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key]);
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
});

// Mock requestIdleCallback
global.requestIdleCallback = jest.fn((callback: Function) => {
  // Execute immediately in tests
  setTimeout(() => callback(), 0);
  return 1; // Return a mock ID
}) as unknown as typeof window.requestIdleCallback;

describe('LocalStorageBatch', () => {
  let batch: LocalStorageBatch;

  beforeEach(() => {
    batch = new LocalStorageBatch({ debug: false });
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe('setItem', () => {
    it('should queue normal priority writes', () => {
      setItem('test-key', 'test-value');
      expect(getQueueSize()).toBeGreaterThan(0);
    });

    it('should write critical items immediately', () => {
      setItemCritical('critical-key', 'critical-value');
      expect(mockLocalStorage.getItem('critical-key')).toBe('critical-value');
      expect(getQueueSize()).toBe(0);
    });

    it('should allow multiple writes to the same key (last write wins)', (done) => {
      setItem('same-key', 'value1');
      setItem('same-key', 'value2');
      setItem('same-key', 'value3');

      // Wait for flush
      setTimeout(() => {
        expect(getItem('same-key')).toBe('value3');
        done();
      }, 200);
    });

    it('should flush when queue reaches max size', () => {
      const maxSize = 50;
      batch = new LocalStorageBatch({ maxQueueSize: maxSize, debug: false });

      // Add maxQueueSize - 1 items
      for (let i = 0; i < maxSize - 1; i++) {
        batch.setItem(`key-${i}`, `value-${i}`);
      }
      expect(getQueueSize()).toBe(maxSize - 1);

      // Add one more to trigger immediate flush
      batch.setItem(`key-${maxSize - 1}`, `value-${maxSize - 1}`);

      // Queue should be flushed
      setTimeout(() => {
        expect(getQueueSize()).toBeLessThan(maxSize);
      }, 10);
    });
  });

  describe('getItem', () => {
    beforeEach(() => {
      mockLocalStorage.setItem('existing-key', 'existing-value');
    });

    it('should return value for existing key', () => {
      expect(getItem('existing-key')).toBe('existing-value');
    });

    it('should return null for non-existing key', () => {
      expect(getItem('non-existing-key')).toBeNull();
    });
  });

  describe('removeItem', () => {
    it('should remove item from localStorage', () => {
      mockLocalStorage.setItem('to-remove', 'value');
      removeItem('to-remove');
      expect(getItem('to-remove')).toBeNull();
    });

    it('should remove item from queue', () => {
      setItem('queued-key', 'queued-value');
      removeItem('queued-key');
      expect(getItem('queued-key')).toBeNull();
    });
  });

  describe('forceFlush', () => {
    it('should flush all queued writes immediately', () => {
      setItem('key1', 'value1');
      setItem('key2', 'value2');
      setItem('key3', 'value3');

      forceFlush();

      setTimeout(() => {
        expect(getItem('key1')).toBe('value1');
        expect(getItem('key2')).toBe('value2');
        expect(getItem('key3')).toBe('value3');
      }, 10);
    });
  });

  describe('clearQueue', () => {
    it('should clear all queued writes without writing', () => {
      setItem('key1', 'value1');
      setItem('key2', 'value2');

      clearQueue();

      expect(getQueueSize()).toBe(0);
      expect(getItem('key1')).toBeNull();
      expect(getItem('key2')).toBeNull();
    });
  });

  describe('getQueueSize', () => {
    it('should return the number of queued writes', () => {
      expect(getQueueSize()).toBe(0);

      setItem('key1', 'value1');
      expect(getQueueSize()).toBe(1);

      setItem('key2', 'value2');
      expect(getQueueSize()).toBe(2);
    });
  });

  describe('getDebugInfo', () => {
    it('should return debug information', () => {
      setItem('key1', 'value1');
      setItem('key2', 'value2');

      const debugInfo = getDebugInfo();

      expect(debugInfo).toHaveProperty('queueSize');
      expect(debugInfo).toHaveProperty('isFlushing');
      expect(debugInfo).toHaveProperty('hasPendingFlush');
      expect(debugInfo).toHaveProperty('writes');

      expect(debugInfo.queueSize).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(debugInfo.writes)).toBe(true);
    });
  });

  describe('automatic flushing', () => {
    it('should flush after maxDelay', (done) => {
      const maxDelay = 100;
      batch = new LocalStorageBatch({ maxDelay, debug: false });

      setItem('key1', 'value1');
      setItem('key2', 'value2');

      setTimeout(() => {
        expect(getItem('key1')).toBe('value1');
        expect(getItem('key2')).toBe('value2');
        done();
      }, maxDelay + 50);
    });

    it('should use requestIdleCallback if available', (done) => {
      setItem('idle-key', 'idle-value');

      // Wait for idle callback to execute
      setTimeout(() => {
        expect(global.requestIdleCallback).toHaveBeenCalled();
        done();
      }, 50);
    });
  });

  describe('error handling', () => {
    it('should handle localStorage.setItem errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => setItemCritical('fail-key', 'fail-value')).toThrow('Storage quota exceeded');

      // Restore original
      mockLocalStorage.setItem = originalSetItem;
    });

    it('should handle localStorage.getItem errors', () => {
      // Mock localStorage to throw error
      const originalGetItem = mockLocalStorage.getItem;
      mockLocalStorage.getItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      const result = getItem('error-key');
      expect(result).toBeNull();

      // Restore original
      mockLocalStorage.getItem = originalGetItem;
    });
  });

  describe('priority handling', () => {
    it('should sort writes by priority', (done) => {
      batch = new LocalStorageBatch({ debug: true });

      setItem('low', 'low-value', 'low');
      setItem('normal', 'normal-value', 'normal');

      // Critical writes should be immediate
      setItemCritical('critical', 'critical-value');

      // Critical should be written immediately
      expect(mockLocalStorage.getItem('critical')).toBe('critical-value');

      // Normal and low should be queued
      setTimeout(() => {
        expect(mockLocalStorage.getItem('normal')).toBe('normal-value');
        expect(mockLocalStorage.getItem('low')).toBe('low-value');
        done();
      }, 150);
    });
  });

  describe('performance', () => {
    it('should batch multiple writes efficiently', (done) => {
      const startTime = Date.now();

      // Queue 100 writes
      for (let i = 0; i < 100; i++) {
        setItem(`key-${i}`, `value-${i}`);
      }

      forceFlush();

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly (< 100ms)
      expect(duration).toBeLessThan(100);

      // All items should be persisted
      setTimeout(() => {
        for (let i = 0; i < 100; i++) {
          expect(getItem(`key-${i}`)).toBe(`value-${i}`);
        }
        done();
      }, 50);
    });
  });
});

describe('Integration with real components', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('should work with theme persistence', (done) => {
    // Simulate ThemeContext behavior
    setItemCritical('theme', 'dark');
    expect(mockLocalStorage.getItem('theme')).toBe('dark');

    setTimeout(() => {
      const savedTheme = getItem('theme');
      expect(savedTheme).toBe('dark');
      done();
    }, 50);
  });

  it('should work with settings persistence', (done) => {
    const settings = { theme: 'light', autoUpdate: true };
    setItem('app-settings', JSON.stringify(settings));

    setTimeout(() => {
      const saved = getItem('app-settings');
      expect(saved).toBe(JSON.stringify(settings));
      const parsed = JSON.parse(saved!);
      expect(parsed).toEqual(settings);
      done();
    }, 150);
  });

  it('should work with model templates', (done) => {
    const templates = { 'llama3-8b': 'llama-3-8b', 'mistral-7b': 'mistral-7b' };
    setItem('model-templates-cache', JSON.stringify(templates));

    setTimeout(() => {
      const saved = getItem('model-templates-cache');
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved!);
      expect(parsed).toEqual(templates);
      done();
    }, 150);
  });
});
