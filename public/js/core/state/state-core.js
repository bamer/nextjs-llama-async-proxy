/**
 * State Core Module - Core state management (get/set/subscribe/notify)
 */
/* global Map Set */

class StateCore {
  constructor() {
    this.state = {};
    this.listeners = new Map();
  }

  /**
   * Get entire state object
   * @returns {Object} Current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get a value from state
   * @param {string} key - State key
   * @returns {*} Value at key
   */
  get(key) {
    return this.state[key];
  }

  /**
   * Deep compare two objects (handles circular references)
   * @param {*} a - First value
   * @param {*} b - Second value
   * @param {Set} visited - Set of visited object pairs
   * @returns {boolean} True if equal
   */
  _deepEqual(a, b, visited = new Set()) {
    // Strict equality
    if (a === b) return true;

    // Handle null/undefined
    if (a === null || a === undefined || b === null || b === undefined) return false;

    // Different types
    if (typeof a !== typeof b) return false;

    // Handle circular references
    if (typeof a === "object" && typeof b === "object") {
      const pairKey = `${Object.prototype.toString.call(a)}-${Object.prototype.toString.call(b)}`;
      if (visited.has(pairKey)) {
        return true; // Assume equal if we've seen this pair before
      }
      visited.add(pairKey);

      // Arrays
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
          visited.delete(pairKey);
          return false;
        }
        const result = a.every((item, index) => this._deepEqual(item, b[index], visited));
        visited.delete(pairKey);
        return result;
      }

      // Objects
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) {
        visited.delete(pairKey);
        return false;
      }

      const result = keysA.every(
        (key) =>
          Object.prototype.hasOwnProperty.call(b, key) && this._deepEqual(a[key], b[key], visited)
      );
      visited.delete(pairKey);
      return result;
    }

    return false;
  }

  /**
   * Set a value in state with notification
   * @param {string} key - State key
   * @param {*} value - New value
   * @returns {StateCore} this for chaining
   */
  set(key, value) {
    // Validate if stateValidator is available
    if (window.stateValidator) {
      const validation = window.stateValidator.validate(key, value);
      if (!validation.valid) {
        console.error("[StateCore] State validation failed:", {
          key,
          errors: validation.errors,
        });
        throw new Error(`Invalid state for "${key}": ${validation.errors[0].message}`);
      }
    }

    const old = this.state[key];

    if (old === value) {
      return this;
    }

    // Use deep equality check for objects to avoid circular reference issues
    if (typeof old === "object" && typeof value === "object" && old !== null && value !== null) {
      if (this._deepEqual(old, value)) {
        return this;
      }
    }

    // Debug logging for status changes
    if (key === "llamaServerStatus" || key === "routerStatus") {
      console.log(`[StateCore] set("${key}"):`, {
        old: old ? { status: old.status, port: old.port } : old,
        new: value ? { status: value.status, port: value.port } : value,
      });
    }

    this.state[key] = value;
    this._notify(key, value, old);
    return this;
  }

  /**
   * Subscribe to state changes
   * @param {string} key - State key to listen to (or "*" for all)
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  /**
   * Notify all subscribers of a state change
   * @param {string} key - State key
   * @param {*} value - New value
   * @param {*} old - Old value
   */
  _notify(key, value, old) {
    this.listeners.get(key)?.forEach((cb) => {
      cb(value, old, this.state);
    });
    this.listeners.get("*")?.forEach((cb) => cb(key, value, old, this.state));
  }
}

window.StateCore = StateCore;
