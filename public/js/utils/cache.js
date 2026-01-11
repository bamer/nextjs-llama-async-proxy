/**
 * Unified Cache Service
 * Provides consistent caching across all state modules
 */

window.CacheService = {
  caches: new Map(),

  /**
   * Get or create a cache instance
   * @param {string} name - Cache name
   * @param {object} options - Cache options
   * @returns {CacheInstance}
   */
  getCache(name, options = {}) {
    const { ttl = 30000, maxSize = 100 } = options;

    if (!this.caches.has(name)) {
      this.caches.set(name, new CacheInstance(name, { ttl, maxSize }));
    }

    const cache = this.caches.get(name);
    // Update options if provided
    cache._ttl = ttl;
    cache._maxSize = maxSize;
    return cache;
  },

  /**
   * Clear all caches
   */
  clearAll() {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  },

  /**
   * Get cache statistics
   */
  getStats() {
    const stats = {};
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = {
        size: cache._cache.size,
        hits: cache._hits,
        misses: cache._misses,
      };
    }
    return stats;
  },

  /**
   * Remove a cache instance
   */
  removeCache(name) {
    const cache = this.caches.get(name);
    if (cache) {
      cache.clear();
      this.caches.delete(name);
    }
  }
};

/**
 * Cache Instance - Individual cache with TTL
 */
class CacheInstance {
  constructor(name, options = {}) {
    this._name = name;
    this._cache = new Map();
    this._ttl = options.ttl || 30000; // 30 seconds default
    this._maxSize = options.maxSize || 100;
    this._hits = 0;
    this._misses = 0;
    this._cleaner = null;
    this._startCleaner();
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null
   */
  get(key) {
    const item = this._cache.get(key);

    if (!item) {
      this._misses++;
      return null;
    }

    // Check TTL
    if (Date.now() - item.timestamp > this._ttl) {
      this._cache.delete(key);
      this._misses++;
      return null;
    }

    this._hits++;
    return item.value;
  }

  /**
   * Set cached value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Optional TTL override (ms)
   */
  set(key, value, ttl = null) {
    // Evict oldest if at max size
    if (this._cache.size >= this._maxSize) {
      const oldestKey = this._cache.keys().next().value;
      this._cache.delete(oldestKey);
    }

    this._cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this._ttl,
    });
  }

  /**
   * Delete cached value
   * @param {string} key - Cache key
   */
  delete(key) {
    return this._cache.delete(key);
  }

  /**
   * Check if key exists and is valid
   * @param {string} key - Cache key
   */
  has(key) {
    const item = this._cache.get(key);
    if (!item) return false;

    // Check TTL
    if (Date.now() - item.timestamp > this._ttl) {
      this._cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear cache
   */
  clear() {
    this._cache.clear();
  }

  /**
   * Execute with caching
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch if cache miss
   * @param {object} options - Options
   * @returns {Promise<any>}
   */
  async getOrFetch(key, fetchFn, options = {}) {
    const { ttl = null, forceRefresh = false } = options;

    if (!forceRefresh) {
      const cached = this.get(key);
      if (cached !== null) {
        return cached;
      }
    }

    const result = await fetchFn();
    this.set(key, result, ttl);
    return result;
  }

  /**
   * Generate cache key from arguments
   */
  static makeKey(...args) {
    return args.map((arg) => {
      if (typeof arg === "object") {
        return JSON.stringify(arg);
      }
      return String(arg);
    }).join(":");
  }

  /**
   * Start periodic cleanup of expired entries
   */
  _startCleaner() {
    // Clean expired entries every minute
    this._cleaner = setInterval(() => {
      this._cleanup();
    }, 60000);
  }

  /**
   * Remove expired entries
   */
  _cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, item] of this._cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this._cache.delete(key);
    }

    // Log cleanup
    if (keysToDelete.length > 0) {
      console.debug(`[CACHE:${this._name}] Cleaned ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Destroy cache instance
   */
  destroy() {
    if (this._cleaner) {
      clearInterval(this._cleaner);
      this._cleaner = null;
    }
    this.clear();
  }

  /**
   * Get cache info
   */
  getInfo() {
    return {
      name: this._name,
      size: this._cache.size,
      maxSize: this._maxSize,
      ttl: this._ttl,
      hits: this._hits,
      misses: this._misses,
      hitRate: this._hits + this._misses > 0
        ? ((this._hits / (this._hits + this._misses)) * 100).toFixed(1) + "%"
        : "N/A",
    };
  }
}
