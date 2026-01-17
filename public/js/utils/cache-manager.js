/**
 * Cache Manager - Persists and restores dashboard data
 * Enables instant dashboard load with cached data while live data loads
 */

class CacheManager {
  constructor() {
    this.prefix = "llama_cache_";
    this.version = 1;
    this.ttl = {
      metrics: 60 * 1000, // 60 seconds
      config: 5 * 60 * 1000, // 5 minutes
      models: 10 * 60 * 1000, // 10 minutes
      settings: 10 * 60 * 1000, // 10 minutes
      presets: 10 * 60 * 1000, // 10 minutes
      metricsHistory: 60 * 1000, // 60 seconds
    };
  }

  /**
   * Save data to cache with timestamp
   * @param {string} key - Cache key
   * @param {any} value - Data to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(key, value, ttl) {
    try {
      const expiresAt = Date.now() + (ttl || this.ttl[key] || 10 * 60 * 1000);
      const cacheData = {
        version: this.version,
        data: value,
        expiresAt,
        savedAt: Date.now(),
      };
      localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(cacheData));
      console.log(`[CACHE] Saved ${key}, expires in ${ttl || this.ttl[key] || 10 * 60 * 1000}ms`);
    } catch (e) {
      console.warn(`[CACHE] Failed to save ${key}:`, e.message);
    }
  }

  /**
   * Get data from cache if not expired
   * @param {string} key - Cache key
   * @returns {any} Cached data or null if expired/missing
   */
  get(key) {
    try {
      const item = localStorage.getItem(`${this.prefix}${key}`);
      if (!item) return null;

      const cacheData = JSON.parse(item);

      // Check version and expiration
      if (cacheData.version !== this.version || Date.now() > cacheData.expiresAt) {
        this.clear(key);
        return null;
      }

      return cacheData.data;
    } catch (e) {
      console.warn(`[CACHE] Failed to read ${key}:`, e.message);
      return null;
    }
  }

  /**
   * Clear a specific cache entry
   * @param {string} key - Cache key
   */
  clear(key) {
    try {
      localStorage.removeItem(`${this.prefix}${key}`);
    } catch (e) {
      console.warn(`[CACHE] Failed to clear ${key}:`, e.message);
    }
  }

  /**
   * Clear all cache entries
   */
  clearAll() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      console.log("[CACHE] Cleared all cache");
    } catch (e) {
      console.warn("[CACHE] Failed to clear all:", e.message);
    }
  }

  /**
   * Get all cached data (excluding expired)
   * @returns {Object} All non-expired cached data
   */
  getAll() {
    const result = {};
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          const cacheKey = key.substring(this.prefix.length);
          const data = this.get(cacheKey);
          if (data) {
            result[cacheKey] = data;
          }
        }
      });
    } catch (e) {
      console.warn("[CACHE] Failed to get all cache:", e.message);
    }
    return result;
  }

  /**
   * Restore state from cache
   * @param {StateCore} stateCore - State core instance
   */
  restoreToState(stateCore) {
    console.log("[CACHE] Restoring state from cache...");
    const cacheKeys = ["metrics", "config", "models", "settings", "presets", "metricsHistory"];

    cacheKeys.forEach((key) => {
      const data = this.get(key);
      if (data) {
        try {
          stateCore.set(key, data);
          console.log(`[CACHE] Restored ${key}`);
        } catch (e) {
          console.warn(`[CACHE] Failed to restore ${key}:`, e.message);
        }
      }
    });
  }
}

const cacheManager = new CacheManager();
window.CacheManager = CacheManager;
window.cacheManager = cacheManager;
