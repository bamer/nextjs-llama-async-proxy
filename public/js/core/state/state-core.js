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
   * Set a value in state with notification
   * @param {string} key - State key
   * @param {*} value - New value
   * @returns {StateCore} this for chaining
   */
  set(key, value) {
    const old = this.state[key];

    if (old === value) {
      return this;
    }

    if (typeof old === "object" && typeof value === "object" && old !== null && value !== null) {
      const oldKeys = Object.keys(old);
      const newKeys = Object.keys(value);
      if (oldKeys.length === newKeys.length && oldKeys.every((k) => old[k] === value[k])) {
        return this;
      }
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
