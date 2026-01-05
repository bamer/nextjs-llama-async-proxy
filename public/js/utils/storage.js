/**
 * Storage Utilities
 * Wrapper for localStorage with error handling and convenience methods
 */

const StorageUtils = {
  /**
   * Get item from storage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if key not found
   * @returns {any} Stored value or default
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      // Try to parse as JSON
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (error) {
      console.warn('[StorageUtils] Error getting item:', key, error);
      return defaultValue;
    }
  },

  /**
   * Set item in storage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @returns {boolean} True if successful
   */
  set(key, value) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.warn('[StorageUtils] Error setting item:', key, error);
      return false;
    }
  },

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   * @returns {boolean} True if successful
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('[StorageUtils] Error removing item:', key, error);
      return false;
    }
  },

  /**
   * Clear all items from storage
   * @returns {boolean} True if successful
   */
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('[StorageUtils] Error clearing storage:', error);
      return false;
    }
  },

  /**
   * Check if key exists in storage
   * @param {string} key - Storage key
   * @returns {boolean} True if key exists
   */
  has(key) {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  },

  /**
   * Get all keys from storage
   * @returns {string[]} Array of keys
   */
  keys() {
    try {
      return Object.keys(localStorage);
    } catch {
      return [];
    }
  },

  /**
   * Get number of items in storage
   * @returns {number} Number of items
   */
  length() {
    try {
      return localStorage.length;
    } catch {
      return 0;
    }
  },

  /**
   * Get string value
   * @param {string} key - Storage key
   * @param {string} defaultValue - Default value
   * @returns {string} Stored string or default
   */
  getString(key, defaultValue = '') {
    const value = this.get(key);
    return typeof value === 'string' ? value : defaultValue;
  },

  /**
   * Get number value
   * @param {string} key - Storage key
   * @param {number} defaultValue - Default value
   * @returns {number} Stored number or default
   */
  getNumber(key, defaultValue = 0) {
    const value = this.get(key);
    return typeof value === 'number' ? value : defaultValue;
  },

  /**
   * Get boolean value
   * @param {string} key - Storage key
   * @param {boolean} defaultValue - Default value
   * @returns {boolean} Stored boolean or default
   */
  getBoolean(key, defaultValue = false) {
    const value = this.get(key);
    return typeof value === 'boolean' ? value : defaultValue;
  },

  /**
   * Get object value
   * @param {string} key - Storage key
   * @param {Object} defaultValue - Default value
   * @returns {Object} Stored object or default
   */
  getObject(key, defaultValue = {}) {
    const value = this.get(key);
    return typeof value === 'object' && value !== null ? value : defaultValue;
  },

  /**
   * Get array value
   * @param {string} key - Storage key
   * @param {Array} defaultValue - Default value
   * @returns {Array} Stored array or default
   */
  getArray(key, defaultValue = []) {
    const value = this.get(key);
    return Array.isArray(value) ? value : defaultValue;
  },

  /**
   * Increment numeric value
   * @param {string} key - Storage key
   * @param {number} amount - Amount to increment
   * @returns {number} New value
   */
  increment(key, amount = 1) {
    const current = this.getNumber(key, 0);
    const newValue = current + amount;
    this.set(key, newValue);
    return newValue;
  },

  /**
   * Toggle boolean value
   * @param {string} key - Storage key
   * @returns {boolean} New value
   */
  toggle(key) {
    const current = this.getBoolean(key, false);
    const newValue = !current;
    this.set(key, newValue);
    return newValue;
  },

  /**
   * Append value to array
   * @param {string} key - Storage key
   * @param {any} value - Value to append
   * @returns {Array} New array
   */
  appendToArray(key, value) {
    const array = this.getArray(key, []);
    array.push(value);
    this.set(key, array);
    return array;
  },

  /**
   * Remove value from array
   * @param {string} key - Storage key
   * @param {Function} predicate - Function to find value to remove
   * @returns {Array} New array
   */
  removeFromArray(key, predicate) {
    const array = this.getArray(key, []);
    const newArray = array.filter(item => !predicate(item));
    this.set(key, newArray);
    return newArray;
  },

  /**
   * Get or set with callback
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value
   * @param {Function} setter - Function to compute new value
   * @returns {any} Current or new value
   */
  getOrSet(key, defaultValue, setter) {
    if (this.has(key)) {
      return this.get(key);
    }
    const newValue = typeof setter === 'function' ? setter(defaultValue) : defaultValue;
    this.set(key, newValue);
    return newValue;
  },

  /**
   * Subscribe to storage changes (for same-origin tabs)
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    const handler = (event) => {
      if (event.key === null) {
        // Storage.clear() was called
        callback(null, null, 'clear');
      } else {
        callback(event.key, event.newValue, event.oldValue);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  },

  /**
   * Backup all storage to object
   * @returns {Object} All storage data
   */
  backup() {
    const backup = {};
    this.keys().forEach(key => {
      backup[key] = this.get(key);
    });
    return backup;
  },

  /**
   * Restore storage from backup
   * @param {Object} backup - Backup data
   * @returns {boolean} True if successful
   */
  restore(backup) {
    if (typeof backup !== 'object' || backup === null) return false;
    this.clear();
    Object.entries(backup).forEach(([key, value]) => {
      this.set(key, value);
    });
    return true;
  }
};

// Export for use in other modules
window.StorageUtils = StorageUtils;
