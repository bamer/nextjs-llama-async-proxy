/**
 * Simplified State Manager - Cache and Sync Layer Only
 * 
 * This is the NEW stateManager that components should use.
 * It's a simple key-value store with subscriptions.
 * 
 * IMPORTANT: Do NOT use stateManager for API calls or orchestration.
 * Call socketClient.request() directly from components instead.
 */

class StateCore {
  constructor() {
    this.state = {};
    this.subscribers = new Map(); // key -> Set of callbacks
  }

  /**
   * Get entire state object
   * @returns {Object} Copy of current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get a value from state by key
   * @param {string} key - State key to retrieve
   * @returns {*} Value stored at key or undefined
   */
  get(key) {
    return this.state[key];
  }

  /**
   * Set a value in state and notify subscribers
   * @param {string} key - State key
   * @param {*} value - Value to store
   */
  set(key, value) {
    const oldValue = this.state[key];

    // Don't notify if value hasn't changed
    if (oldValue === value) {
      return;
    }

    this.state[key] = value;

    // Notify subscribers for this key
    this.subscribers.get(key)?.forEach((callback) => {
      try {
        callback(value, oldValue, this.state);
      } catch (e) {
        console.error(`[StateCore] Subscriber error for key "${key}":`, e);
      }
    });

    // Notify wildcard subscribers
    this.subscribers.get("*")?.forEach((callback) => {
      try {
        callback(value, oldValue, this.state);
      } catch (e) {
        console.error(`[StateCore] Wildcard subscriber error:`, e);
      }
    });
  }

  /**
   * Subscribe to state changes
   * @param {string} key - State key to listen to (or "*" for all)
   * @param {Function} callback - Function called on change (value, oldValue, state)
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    this.subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }
}

/**
 * StateManager - Simple cache layer
 * 
 * Use this ONLY for:
 * - Caching data received from socket handlers
 * - Reading cached data
 * - Subscribing to cache changes
 * 
 * Do NOT use this for:
 * - API calls (use socketClient.request instead)
 * - Business logic
 * - Orchestrating operations
 */
class StateManager {
  constructor() {
    this.core = new StateCore();
  }

  /**
   * Get entire state object
   */
  getState() {
    return this.core.getState();
  }

  /**
   * Get a cached value by key
   */
  get(key) {
    return this.core.get(key);
  }

  /**
   * Set a value in cache
   */
  set(key, value) {
    this.core.set(key, value);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(key, callback) {
    return this.core.subscribe(key, callback);
  }

  /**
   * Check if socket is connected
   */
  isConnected() {
    return socketClient?.isConnected || false;
  }
}

const stateManager = new StateManager();
window.StateManager = StateManager;
window.stateManager = stateManager;
