/**
 * State Manager - Event-driven state management
 * Centralized state with subscriptions
 */

class StateManager {
  constructor() {
    this.state = {};
    this.listeners = new Map();
    this.socket = null;
    this.connectionStatus = 'disconnected';
    this.requestQueue = [];
    this.pendingRequests = new Map();
  }

  /**
   * Initialize with Socket.IO connection
   */
  init(socket) {
    this.socket = socket;
    this._setupSocketListeners();
  }

  /**
   * Setup Socket.IO event listeners
   */
  _setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.connectionStatus = 'connected';
      this._processRequestQueue();
      this._notifyConnectionChange('connected');
    });

    this.socket.on('disconnect', () => {
      this.connectionStatus = 'disconnected';
      this._notifyConnectionChange('disconnected');
    });

    this.socket.on('connect_error', () => {
      this.connectionStatus = 'error';
      this._notifyConnectionChange('error');
    });

    // Listen for broadcasts and responses
    this._registerDefaultListeners();
  }

  /**
   * Register default listeners for common broadcasts
   */
  _registerDefaultListeners() {
    // Models broadcasts
    this.socket.on('models:list', (data) => {
      if (data.type === 'broadcast') {
        this._updateState('models', data.data.models || []);
      }
    });

    this.socket.on('models:status', (data) => {
      if (data.type === 'broadcast') {
        const { modelId, status, model } = data.data;
        this._updateModelStatus(modelId, status, model);
      }
    });

    this.socket.on('models:created', (data) => {
      if (data.type === 'broadcast') {
        this._addModel(data.data.model);
      }
    });

    this.socket.on('models:updated', (data) => {
      if (data.type === 'broadcast') {
        this._updateModel(data.data.model);
      }
    });

    this.socket.on('models:deleted', (data) => {
      if (data.type === 'broadcast') {
        this._removeModel(data.data.modelId);
      }
    });

    // Metrics broadcasts
    this.socket.on('metrics:update', (data) => {
      if (data.type === 'broadcast') {
        this._updateState('metrics', data.data.metrics);
        this._addMetricToHistory(data.data.metrics);
      }
    });

    // Logs broadcasts
    this.socket.on('logs:entry', (data) => {
      if (data.type === 'broadcast') {
        this._addLog(data.data.entry);
      }
    });

    // Llama status broadcasts
    this.socket.on('llama:status', (data) => {
      if (data.type === 'broadcast') {
        this._updateState('llamaStatus', data.data);
      }
    });
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get specific state value
   */
  get(key) {
    return this.state[key];
  }

  /**
   * Update state
   */
  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    this._notify(key, value, oldValue);
    return this;
  }

  /**
   * Update multiple state values
   */
  setState(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value);
    });
    return this;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(callback);
      }
    };
  }

  /**
   * Subscribe to any state change
   */
  subscribeAll(callback) {
    return this.subscribe('*', callback);
  }

  /**
   * Notify listeners of state change
   */
  _notify(key, newValue, oldValue) {
    // Notify specific key listeners
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(callback => {
        try {
          callback(newValue, oldValue, this.state);
        } catch (error) {
          console.error('[StateManager] Listener error:', error);
        }
      });
    }

    // Notify wildcard listeners
    const allListeners = this.listeners.get('*');
    if (allListeners) {
      allListeners.forEach(callback => {
        try {
          callback(key, newValue, oldValue, this.state);
        } catch (error) {
          console.error('[StateManager] Wildcard listener error:', error);
        }
      });
    }
  }

  /**
   * Notify connection status change
   */
  _notifyConnectionChange(status) {
    this._notify('connectionStatus', status, this.connectionStatus);
  }

  /**
   * Internal state update helper
   */
  _updateState(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    this._notify(key, value, oldValue);
  }

  // Model helpers
  _updateModelStatus(modelId, status, model) {
    const models = this.state.models || [];
    const index = models.findIndex(m => m.id === modelId);
    if (index !== -1) {
      const updated = { ...models[index], status };
      if (model) Object.assign(updated, model);
      models[index] = updated;
      this._notify('models', models, models);
    }
  }

  _addModel(model) {
    const models = [...(this.state.models || []), model];
    this._notify('models', models, this.state.models);
  }

  _updateModel(updatedModel) {
    const models = (this.state.models || []).map(m =>
      m.id === updatedModel.id ? updatedModel : m
    );
    this._notify('models', models, this.state.models);
  }

  _removeModel(modelId) {
    const models = (this.state.models || []).filter(m => m.id !== modelId);
    this._notify('models', models, this.state.models);
  }

  // Metrics helpers
  _addMetricToHistory(metrics) {
    const history = this.state.metricsHistory || [];
    history.push({ ...metrics, timestamp: Date.now() });

    // Keep last 200 entries
    if (history.length > 200) {
      history.shift();
    }

    this._notify('metricsHistory', history, this.state.metricsHistory);
  }

  // Logs helpers
  _addLog(entry) {
    const logs = [entry, ...(this.state.logs || [])].slice(0, 100);
    this._notify('logs', logs, this.state.logs);
  }

  // =====================================
  // Socket.IO Request Methods
  // =====================================

  /**
   * Send request and wait for response
   */
  request(event, data = {}) {
    return new Promise((resolve, reject) => {
      if (this.connectionStatus !== 'connected') {
        // Queue request for later
        this.requestQueue.push({ event, data, resolve, reject });
        return;
      }

      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.pendingRequests.set(requestId, { resolve, reject, event });

      // Set timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout: ${event}`));
      }, 30000);

      this.pendingRequests.get(requestId).timeout = timeout;

      this.socket.emit(event, { ...data, requestId });
    });
  }

  /**
   * Process queued requests after reconnection
   */
  _processRequestQueue() {
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    queue.forEach(({ event, data, resolve, reject }) => {
      this.request(event, data).then(resolve).catch(reject);
    });
  }

  /**
   * Handle Socket.IO response
   */
  _handleResponse(response) {
    const { requestId, success, data, error } = response;

    if (!requestId) {
      console.warn('[StateManager] Response without requestId:', response);
      return;
    }

    const pending = this.pendingRequests.get(requestId);
    if (!pending) {
      console.warn('[StateManager] Unknown requestId:', requestId);
      return;
    }

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(requestId);

    if (success) {
      pending.resolve(data);
    } else {
      pending.reject(new Error(error?.message || 'Request failed'));
    }
  }

  // Convenience methods - Models
  async getModels() {
    return this.request('models:list');
  }

  async getModel(modelId) {
    return this.request('models:get', { modelId });
  }

  async createModel(model) {
    return this.request('models:create', { model });
  }

  async updateModel(modelId, updates) {
    return this.request('models:update', { modelId, updates });
  }

  async deleteModel(modelId) {
    return this.request('models:delete', { modelId });
  }

  async startModel(modelId) {
    return this.request('models:start', { modelId });
  }

  async stopModel(modelId) {
    return this.request('models:stop', { modelId });
  }

  // Convenience methods - Metrics
  async getMetrics() {
    return this.request('metrics:get');
  }

  async getMetricsHistory(params = {}) {
    return this.request('metrics:history', params);
  }

  // Convenience methods - Logs
  async getLogs(params = {}) {
    return this.request('logs:get', params);
  }

  async clearLogs() {
    return this.request('logs:clear');
  }

  // Convenience methods - Config
  async getConfig() {
    return this.request('config:get');
  }

  async updateConfig(config) {
    return this.request('config:update', { config });
  }

  // Convenience methods - Settings
  async getSettings() {
    return this.request('settings:get');
  }

  async updateSettings(settings) {
    return this.request('settings:update', { settings });
  }

  // Convenience methods - Llama
  async getLlamaStatus() {
    return this.request('llama:status');
  }

  async startLlama(config) {
    return this.request('llama:start', { config });
  }

  async stopLlama() {
    return this.request('llama:stop');
  }

  async rescanModels() {
    return this.request('llama:rescan');
  }

  // Convenience methods - Templates
  async getTemplates() {
    return this.request('templates:get');
  }

  async updateTemplates(templates) {
    return this.request('templates:update', { templates });
  }

  // Convenience methods - Fit Params
  async analyzeFitParams(modelName) {
    return this.request('fitparams:analyze', { modelName });
  }

  async getFitParams(modelName) {
    return this.request('fitparams:get', { modelName });
  }
}

// Singleton instance
const stateManager = new StateManager();

// Export
window.StateManager = StateManager;
window.stateManager = stateManager;
