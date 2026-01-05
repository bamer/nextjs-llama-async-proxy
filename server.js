/**
 * Vanilla JavaScript Server - Llama Async Proxy Dashboard
 * Pure Node.js + Socket.IO server with no TypeScript dependencies
 */

import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import DatabasePackage from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const Database = DatabasePackage;

// ============================================
// Database Layer (SQLite via better-sqlite3)
// ============================================

class DatabaseLayer {
  constructor(dbPath = null) {
    this.dbPath = dbPath || path.join(process.cwd(), 'data', 'llama-dashboard.db');
    this.db = new Database(this.dbPath);
    this.init();
  }

  init() {
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS models (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'llama',
        status TEXT DEFAULT 'idle',
        parameters TEXT DEFAULT '{}',
        model_path TEXT,
        model_url TEXT,
        ctx_size INTEGER DEFAULT 2048,
        batch_size INTEGER DEFAULT 512,
        threads INTEGER DEFAULT 4,
        created_at INTEGER,
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS model_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        config TEXT DEFAULT '{}',
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cpu_usage REAL,
        memory_usage REAL,
        disk_usage REAL,
        gpu_usage REAL,
        gpu_temperature REAL,
        gpu_memory_used REAL,
        gpu_memory_total REAL,
        gpu_power_usage REAL,
        active_models INTEGER,
        uptime REAL,
        requests_per_minute INTEGER,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        source TEXT,
        context TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS server_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
    `);
  }

  // Models
  getModels() {
    return this.db.prepare('SELECT * FROM models ORDER BY created_at DESC').all();
  }

  getModel(id) {
    return this.db.prepare('SELECT * FROM models WHERE id = ?').get(id);
  }

  saveModel(model) {
    const id = model.id || `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO models (id, name, type, status, parameters, model_path, model_url, ctx_size, batch_size, threads, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      model.name,
      model.type || 'llama',
      model.status || 'idle',
      JSON.stringify(model.parameters || {}),
      model.model_path || model.path || null,
      model.model_url || model.url || null,
      model.ctx_size || 2048,
      model.batch_size || 512,
      model.threads || 4,
      model.created_at || now,
      now
    );

    return this.getModel(id);
  }

  updateModel(id, updates) {
    const allowedFields = ['name', 'type', 'status', 'parameters', 'model_path', 'model_url', 'ctx_size', 'batch_size', 'threads'];
    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(key === 'parameters' ? JSON.stringify(value) : value);
      }
    }

    if (updateFields.length === 0) return null;

    updateFields.push('updated_at = ?');
    values.push(Math.floor(Date.now() / 1000));
    values.push(id);

    this.db.prepare(`UPDATE models SET ${updateFields.join(', ')} WHERE id = ?`).run(...values);
    return this.getModel(id);
  }

  deleteModel(id) {
    const result = this.db.prepare('DELETE FROM models WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // Metrics
  saveMetrics(metrics) {
    const stmt = this.db.prepare(`
      INSERT INTO metrics (cpu_usage, memory_usage, disk_usage, gpu_usage, gpu_temperature, gpu_memory_used, gpu_memory_total, gpu_power_usage, active_models, uptime, requests_per_minute)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      metrics.cpu_usage || 0,
      metrics.memory_usage || 0,
      metrics.disk_usage || 0,
      metrics.gpu_usage || 0,
      metrics.gpu_temperature || 0,
      metrics.gpu_memory_used || 0,
      metrics.gpu_memory_total || 0,
      metrics.gpu_power_usage || 0,
      metrics.active_models || 0,
      metrics.uptime || 0,
      metrics.requests_per_minute || 0
    );
  }

  getMetricsHistory({ limit = 100, hours = 24 } = {}) {
    const cutoff = Math.floor(Date.now() / 1000) - (hours * 3600);
    return this.db.prepare(`
      SELECT * FROM metrics WHERE timestamp > ? ORDER BY timestamp DESC LIMIT ?
    `).all(cutoff, limit);
  }

  getLatestMetrics() {
    return this.db.prepare('SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 1').get();
  }

  // Logs
  getLogs({ limit = 100, level = null } = {}) {
    if (level) {
      return this.db.prepare('SELECT * FROM logs WHERE level = ? ORDER BY timestamp DESC LIMIT ?').all(level, limit);
    }
    return this.db.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?').all(limit);
  }

  insertLog(level, message, source = 'server', context = null) {
    const stmt = this.db.prepare('INSERT INTO logs (level, message, source, context) VALUES (?, ?, ?, ?)');
    stmt.run(level, typeof message === 'object' ? JSON.stringify(message) : message, source, context ? JSON.stringify(context) : null);
  }

  clearLogs() {
    return this.db.prepare('DELETE FROM logs').run().changes;
  }

  // Config
  getServerConfig() {
    const defaults = {
      serverPath: '/usr/local/bin/llama-server',
      host: 'localhost',
      port: 8080,
      baseModelsPath: path.join(os.homedir(), 'models'),
      ctx_size: 2048,
      batch_size: 512,
      threads: 4,
      autoStart: false
    };

    try {
      const configStr = this.db.prepare('SELECT value FROM server_config WHERE key = ?').get('config')?.value;
      if (configStr) {
        return { ...defaults, ...JSON.parse(configStr) };
      }
    } catch (e) {
      console.error('Error loading config:', e);
    }
    return defaults;
  }

  saveServerConfig(config) {
    this.db.prepare('INSERT OR REPLACE INTO server_config (key, value) VALUES (?, ?)').run('config', JSON.stringify(config));
  }

  // Metadata
  setMetadata(key, value) {
    this.db.prepare('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
  }

  getMetadata(key, defaultValue = null) {
    try {
      const result = this.db.prepare('SELECT value FROM metadata WHERE key = ?').get(key);
      if (result) {
        return JSON.parse(result.value);
      }
    } catch (e) {
      console.error('Error loading metadata:', e);
    }
    return defaultValue;
  }
}

// ============================================
// Logger
// ============================================

class Logger {
  constructor() {
    this.levels = ['debug', 'info', 'warn', 'error'];
    this.logQueue = [];
    this.maxQueueSize = 500;
    this.logCounter = 0;
    this.io = null;
  }

  setIo(io) {
    this.io = io;
  }

  log(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    this.logCounter++;

    const logEntry = {
      id: `${Date.now()}-${this.logCounter}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      level,
      message: typeof message === 'object' ? JSON.stringify(message) : String(message),
      context: { source: 'application', ...context }
    };

    // Add to queue
    this.logQueue.unshift(logEntry);
    if (this.logQueue.length > this.maxQueueSize) {
      this.logQueue.pop();
    }

    // Output to console
    const prefix = {
      debug: '🔵',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    }[level] || '📝';

    console.log(`${prefix} [${timestamp.split('T')[1].split('.')[0]}] ${message}`);

    // Broadcast to clients
    if (this.io) {
      this.io.emit('logs:entry', {
        type: 'broadcast',
        event: 'logs:entry',
        data: { entry: logEntry },
        timestamp: Date.now()
      });
    }
  }

  debug(message, context) { this.log('debug', message, context); }
  info(message, context) { this.log('info', message, context); }
  warn(message, context) { this.log('warn', message, context); }
  error(message, context) { this.log('error', message, context); }
}

const logger = new Logger();

// ============================================
// Socket.IO Event Handlers
// ============================================

function setupEventHandlers(io, db) {
  logger.info('Setting up Socket.IO event handlers...');

  io.on('connection', (socket) => {
    const clientId = socket.id;
    logger.info(`Client connected: ${clientId}`);

    // Send connection acknowledgment
    socket.emit('connection:established', {
      type: 'broadcast',
      event: 'connection:established',
      data: { clientId, timestamp: Date.now(), message: 'Connected to Socket.IO server' },
      timestamp: Date.now()
    });

    // === MODELS ===
    socket.on('models:list', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const models = db.getModels();
        socket.emit('models:list:result', {
          type: 'response',
          event: 'models:list',
          success: true,
          data: { models },
          error: null,
          requestId,
          timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('models:list:result', {
          type: 'response',
          event: 'models:list',
          success: false,
          data: null,
          error: { code: 'LIST_MODELS_FAILED', message: error.message },
          requestId,
          timestamp: Date.now()
        });
      }
    });

    socket.on('models:get', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const { modelId } = request?.data || {};
        if (!modelId) throw new Error('modelId is required');
        const model = db.getModel(modelId);
        socket.emit('models:get:result', {
          type: 'response', event: 'models:get', success: true,
          data: { model }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('models:get:result', {
          type: 'response', event: 'models:get', success: false,
          data: null, error: { code: 'GET_MODEL_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    socket.on('models:create', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const { model } = request?.data || {};
        if (!model) throw new Error('Model data is required');
        const savedModel = db.saveModel(model);
        io.emit('models:created', {
          type: 'broadcast', event: 'models:created', data: { model: savedModel }, timestamp: Date.now()
        });
        socket.emit('models:create:result', {
          type: 'response', event: 'models:create', success: true,
          data: { model: savedModel }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('models:create:result', {
          type: 'response', event: 'models:create', success: false,
          data: null, error: { code: 'CREATE_MODEL_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    socket.on('models:update', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const { modelId, updates } = request?.data || {};
        if (!modelId) throw new Error('modelId is required');
        const updatedModel = db.updateModel(modelId, updates);
        if (!updatedModel) throw new Error('Model not found');
        io.emit('models:updated', {
          type: 'broadcast', event: 'models:updated', data: { model: updatedModel }, timestamp: Date.now()
        });
        socket.emit('models:update:result', {
          type: 'response', event: 'models:update', success: true,
          data: { model: updatedModel }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('models:update:result', {
          type: 'response', event: 'models:update', success: false,
          data: null, error: { code: 'UPDATE_MODEL_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    socket.on('models:delete', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const { modelId } = request?.data || {};
        if (!modelId) throw new Error('modelId is required');
        db.deleteModel(modelId);
        io.emit('models:deleted', {
          type: 'broadcast', event: 'models:deleted', data: { modelId }, timestamp: Date.now()
        });
        socket.emit('models:delete:result', {
          type: 'response', event: 'models:delete', success: true,
          data: { deletedId: modelId }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('models:delete:result', {
          type: 'response', event: 'models:delete', success: false,
          data: null, error: { code: 'DELETE_MODEL_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    socket.on('models:start', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const { modelId } = request?.data || {};
        if (!modelId) throw new Error('modelId is required');
        db.updateModel(modelId, { status: 'loading', progress: 0 });
        io.emit('models:status', {
          type: 'broadcast', event: 'models:status',
          data: { modelId, status: 'loading', progress: 0 }, timestamp: Date.now()
        });
        const updatedModel = db.updateModel(modelId, { status: 'running' });
        io.emit('models:status', {
          type: 'broadcast', event: 'models:status',
          data: { modelId, status: 'running', model: updatedModel }, timestamp: Date.now()
        });
        socket.emit('models:start:result', {
          type: 'response', event: 'models:start', success: true,
          data: { model: updatedModel }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('models:start:result', {
          type: 'response', event: 'models:start', success: false,
          data: null, error: { code: 'START_MODEL_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    socket.on('models:stop', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const { modelId } = request?.data || {};
        if (!modelId) throw new Error('modelId is required');
        const updatedModel = db.updateModel(modelId, { status: 'idle' });
        io.emit('models:status', {
          type: 'broadcast', event: 'models:status',
          data: { modelId, status: 'idle', model: updatedModel }, timestamp: Date.now()
        });
        socket.emit('models:stop:result', {
          type: 'response', event: 'models:stop', success: true,
          data: { model: updatedModel }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('models:stop:result', {
          type: 'response', event: 'models:stop', success: false,
          data: null, error: { code: 'STOP_MODEL_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    socket.on('models:import', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const models = db.getModels();
        socket.emit('models:import:result', {
          type: 'response', event: 'models:import', success: true,
          data: { imported: 0, skipped: models.length, models: [] }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('models:import:result', {
          type: 'response', event: 'models:import', success: false,
          data: null, error: { code: 'IMPORT_MODELS_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    // === METRICS ===
    socket.on('metrics:get', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const latestMetrics = db.getLatestMetrics() || {};
        const metrics = {
          cpu: { usage: latestMetrics.cpu_usage || 0 },
          memory: { used: latestMetrics.memory_usage || 0 },
          disk: { used: latestMetrics.disk_usage || 0 },
          network: { rx: 0, tx: 0 },
          uptime: latestMetrics.uptime || 0,
          gpu: latestMetrics.gpu_usage ? {
            usage: latestMetrics.gpu_usage || 0,
            memoryUsed: latestMetrics.gpu_memory_used || 0,
            memoryTotal: latestMetrics.gpu_memory_total || 0,
            powerUsage: latestMetrics.gpu_power_usage || 0,
            powerLimit: 0,
            temperature: latestMetrics.gpu_temperature || 0
          } : undefined
        };
        socket.emit('metrics:get:result', {
          type: 'response', event: 'metrics:get', success: true,
          data: { metrics }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('metrics:get:result', {
          type: 'response', event: 'metrics:get', success: false,
          data: null, error: { code: 'GET_METRICS_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    socket.on('metrics:history', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const { limit = 100, hours = 24 } = request?.data || {};
        const history = db.getMetricsHistory({ limit, hours }).map(m => ({
          cpu: { usage: m.cpu_usage || 0 },
          memory: { used: m.memory_usage || 0 },
          disk: { used: m.disk_usage || 0 },
          network: { rx: 0, tx: 0 },
          uptime: m.uptime || 0,
          timestamp: m.timestamp
        }));
        socket.emit('metrics:history:result', {
          type: 'response', event: 'metrics:history', success: true,
          data: { history }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('metrics:history:result', {
          type: 'response', event: 'metrics:history', success: false,
          data: null, error: { code: 'GET_METRICS_HISTORY_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    // === LOGS ===
    socket.on('logs:get', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const { limit = 100, level } = request?.data || {};
        const logs = db.getLogs({ limit, level });
        socket.emit('logs:get:result', {
          type: 'response', event: 'logs:get', success: true,
          data: { logs }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('logs:get:result', {
          type: 'response', event: 'logs:get', success: false,
          data: null, error: { code: 'GET_LOGS_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    socket.on('logs:clear', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const cleared = db.clearLogs();
        socket.emit('logs:clear:result', {
          type: 'response', event: 'logs:clear', success: true,
          data: { cleared }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('logs:clear:result', {
          type: 'response', event: 'logs:clear', success: false,
          data: null, error: { code: 'CLEAR_LOGS_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    // === CONFIG ===
    socket.on('config:get', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const config = db.getServerConfig();
        socket.emit('config:get:result', {
          type: 'response', event: 'config:get', success: true,
          data: { config }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('config:get:result', {
          type: 'response', event: 'config:get', success: false,
          data: null, error: { code: 'GET_CONFIG_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    socket.on('config:update', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const { config } = request?.data || {};
        if (!config) throw new Error('Config data is required');
        db.saveServerConfig(config);
        socket.emit('config:update:result', {
          type: 'response', event: 'config:update', success: true,
          data: { config }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('config:update:result', {
          type: 'response', event: 'config:update', success: false,
          data: null, error: { code: 'UPDATE_CONFIG_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    // === SETTINGS ===
    socket.on('settings:get', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const settings = db.getMetadata('user_settings') || {};
        socket.emit('settings:get:result', {
          type: 'response', event: 'settings:get', success: true,
          data: { settings }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('settings:get:result', {
          type: 'response', event: 'settings:get', success: false,
          data: null, error: { code: 'GET_SETTINGS_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    socket.on('settings:update', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const { settings } = request?.data || {};
        db.setMetadata('user_settings', settings);
        socket.emit('settings:update:result', {
          type: 'response', event: 'settings:update', success: true,
          data: { settings }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('settings:update:result', {
          type: 'response', event: 'settings:update', success: false,
          data: null, error: { code: 'UPDATE_SETTINGS_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    // === LLAMA ===
    socket.on('llama:status', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const models = db.getModels();
        const status = {
          status: 'idle',
          lastError: null,
          uptime: 0,
          startedAt: null,
          models
        };
        socket.emit('llama:status:result', {
          type: 'response', event: 'llama:status', success: true,
          data: { status }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('llama:status:result', {
          type: 'response', event: 'llama:status', success: false,
          data: null, error: { code: 'GET_LLAMA_STATUS_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    socket.on('llama:start', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        logger.info('Llama server start requested (placeholder)');
        io.emit('llama:status', {
          type: 'broadcast', event: 'llama:status', data: { status: 'running' }, timestamp: Date.now()
        });
        socket.emit('llama:start:result', {
          type: 'response', event: 'llama:start', success: true,
          data: { success: true }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('llama:start:result', {
          type: 'response', event: 'llama:start', success: false,
          data: null, error: { code: 'START_LLAMA_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    socket.on('llama:stop', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        logger.info('Llama server stop requested (placeholder)');
        io.emit('llama:status', {
          type: 'broadcast', event: 'llama:status', data: { status: 'idle' }, timestamp: Date.now()
        });
        socket.emit('llama:stop:result', {
          type: 'response', event: 'llama:stop', success: true,
          data: { success: true }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('llama:stop:result', {
          type: 'response', event: 'llama:stop', success: false,
          data: null, error: { code: 'STOP_LLAMA_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    socket.on('llama:rescan', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        logger.info('Model rescan requested (placeholder)');
        socket.emit('llama:rescan:result', {
          type: 'response', event: 'llama:rescan', success: true,
          data: { scanned: 0 }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('llama:rescan:result', {
          type: 'response', event: 'llama:rescan', success: false,
          data: null, error: { code: 'RESCAN_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    // === SYSTEM ===
    socket.on('system:info', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const info = {
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpuCount: os.cpus().length
        };
        socket.emit('system:info:result', {
          type: 'response', event: 'system:info', success: true,
          data: { info }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('system:info:result', {
          type: 'response', event: 'system:info', success: false,
          data: null, error: { code: 'GET_SYSTEM_INFO_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    socket.on('system:health', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        socket.emit('system:health:result', {
          type: 'response', event: 'system:health', success: true,
          data: { status: 'healthy', details: {} }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('system:health:result', {
          type: 'response', event: 'system:health', success: false,
          data: null, error: { code: 'HEALTH_CHECK_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    // === TEMPLATES ===
    socket.on('templates:get', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const templates = db.getMetadata('model_templates') || { templates: {} };
        socket.emit('templates:get:result', {
          type: 'response', event: 'templates:get', success: true,
          data: { templates }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('templates:get:result', {
          type: 'response', event: 'templates:get', success: false,
          data: null, error: { code: 'GET_TEMPLATES_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    socket.on('templates:update', async (request) => {
      const requestId = request?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const { templates } = request?.data || {};
        db.setMetadata('model_templates', templates);
        socket.emit('templates:update:result', {
          type: 'response', event: 'templates:update', success: true,
          data: { templates }, error: null, requestId, timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('templates:update:result', {
          type: 'response', event: 'templates:update', success: false,
          data: null, error: { code: 'UPDATE_TEMPLATES_FAILED', message: error.message }, requestId, timestamp: Date.now()
        });
      }
    });

    // Disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${clientId}, reason: ${reason}`);
    });
  });

  logger.info('Socket.IO event handlers setup complete');
}

// ============================================
// Metrics Collection
// ============================================

function startMetricsCollection(io, db) {
  setInterval(async () => {
    try {
      const memUsage = process.memoryUsage();
      const cpus = os.cpus();
      const cpuUsage = cpus.length > 0 ? cpus.reduce((acc, cpu) => {
        return acc + (cpu.times.user + cpu.times.nice + cpu.times.sys) / (cpu.times.idle + cpu.times.user + cpu.times.nice + cpu.times.sys);
      }, 0) / cpus.length * 100 : 0;

      const metrics = {
        cpu_usage: cpuUsage,
        memory_usage: memUsage.heapUsed,
        disk_usage: 0,
        active_models: 0,
        uptime: process.uptime(),
        requests_per_minute: 0
      };

      db.saveMetrics(metrics);

      // Broadcast metrics
      io.emit('metrics:update', {
        type: 'broadcast',
        event: 'metrics:update',
        data: {
          metrics: {
            cpu: { usage: cpuUsage },
            memory: { used: memUsage.heapUsed },
            disk: { used: 0 },
            network: { rx: 0, tx: 0 },
            uptime: process.uptime()
          }
        },
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error('Error collecting metrics:', error);
    }
  }, 10000);

  logger.info('Metrics collection started (every 10s)');
}

// ============================================
// Main Server
// ============================================

async function main() {
  const port = process.env.PORT || 3000;
  const hostname = 'localhost';

  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Initialize database
  const db = new DatabaseLayer();
  logger.info('Database initialized');

  // Create Express app
  const app = express();
  const server = http.createServer(app);

  // Socket.IO configuration
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true
    },
    path: '/llamaproxws',
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e8,
    transports: ['polling', 'websocket']
  });

  // Set Socket.IO for logger
  logger.setIo(io);

  // Setup event handlers
  setupEventHandlers(io, db);

  // Start metrics collection
  startMetricsCollection(io, db);

  // Serve static files
  app.use(express.static(path.join(__dirname, 'public')));

  // Serve Socket.IO client
  app.use('/socket.io', express.static(path.join(__dirname, 'node_modules', 'socket.io', 'client-dist')));

  // SPA fallback - serve index.html for all non-API routes
  app.use((_req, res, next) => {
    if (_req.method === 'GET' && !_req.path.startsWith('/socket.io') && !_req.path.startsWith('/llamaproxws')) {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
      next();
    }
  });

  // Start server
  server.listen(port, () => {
    console.log('');
    console.log('═'.repeat(50));
    console.log('🦙  Llama Async Proxy - Vanilla Server');
    console.log('═'.repeat(50));
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO at ws://${hostname}:${port}/llamaproxws`);
    console.log(`> Static files from: ${path.join(__dirname, 'public')}`);
    console.log('═'.repeat(50));
    console.log('');
    logger.info('Server started successfully');
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('Could not close connections in time, forcing shutdown');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
