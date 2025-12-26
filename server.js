// server.js - Serveur principal avec Socket.IO et gestion Llama
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import express from 'express';
import { LlamaService } from './src/server/services/LlamaService.ts';
import fs from 'fs';
import path from 'path';

// Logger simple pour le développement
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  debug: (...args) => console.debug('[DEBUG]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args)
};

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const nextHandler = app.getRequestHandler()
const hostname = 'localhost';
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Configuration des intervalles de mise à jour (en ms)
const UPDATE_CONFIG = {
  METRICS_INTERVAL: 10000,  // 10 secondes entre chaque mise à jour des métriques
  MODELS_INTERVAL: 30000,   // 30 secondes pour les modèles (change rarement)
  LOGS_INTERVAL: 15000,     // 15 secondes pour les logs
};

// Charger la configuration Llama
let llamaConfig = {
  llama_server_host: 'localhost',
  llama_server_port: 8134,
  llama_server_path: 'llama-server',
  llama_model_path: './models/model.gguf',
};

try {
  const configPath = './.llama-proxy-config.json';
  if (fs.existsSync(configPath)) {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    llamaConfig = { ...llamaConfig, ...configData };
    logger.info('✅ [CONFIG] Llama config loaded from .llama-proxy-config.json');
    logger.info(`✅ [CONFIG] Using llama-server at: ${llamaConfig.llama_server_path}`);
  }
} catch (error) {
  logger.warn(`⚠️ [CONFIG] Failed to load config: ${error.message}. Using defaults.`);
}

logger.info('🚀 [SOCKET.IO] Initializing Socket.IO server...');

app.prepare().then(async () => {
  logger.info('✅ [SOCKET.IO] Next.js app prepared, starting HTTP server...');
  
  const expressApp = express();
  const server = createServer(expressApp);

  // Create Socket.IO server with CORS configuration
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
    path: '/llamaproxws',
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e8,
    transports: ['websocket'],
  });
  logger.info('🔧 [SOCKET.IO] Socket.IO server configured with path: /llamaproxws');

  // Initialize Llama Service with full configuration
  // IMPORTANT: Do NOT specify modelPath on startup - let llama-server start without loading a model
  // basePath is used for auto-discovery, and clients can load models via API after startup
  const llamaServiceConfig = {
    host: llamaConfig.llama_server_host,
    port: llamaConfig.llama_server_port,
    // REMOVED: modelPath - this causes crashes if file doesn't exist
    // Instead use basePath for auto-discovery
    basePath: llamaConfig.basePath || './models',  // Path for auto-discovery of models
    serverPath: llamaConfig.llama_server_path,
    // Pass all configuration options
    ctx_size: llamaConfig.ctx_size,
    batch_size: llamaConfig.batch_size,
    ubatch_size: llamaConfig.ubatch_size,
    threads: llamaConfig.threads,
    threads_batch: llamaConfig.threads_batch,
    gpu_layers: llamaConfig.gpu_layers,
    main_gpu: llamaConfig.main_gpu,
    flash_attn: llamaConfig.flash_attn,
    n_predict: llamaConfig.n_predict,
    temperature: llamaConfig.temperature,
    top_k: llamaConfig.top_k,
    top_p: llamaConfig.top_p,
    repeat_penalty: llamaConfig.repeat_penalty,
    seed: llamaConfig.seed,
    verbose: llamaConfig.verbose,
    embedding: llamaConfig.embedding,
    cache_type_k: llamaConfig.cache_type_k,
    cache_type_v: llamaConfig.cache_type_v,
    // Additional sampling options
    min_p: llamaConfig.min_p,
    xtc_probability: llamaConfig.xtc_probability,
    xtc_threshold: llamaConfig.xtc_threshold,
    typical_p: llamaConfig.typical_p,
    repeat_last_n: llamaConfig.repeat_last_n,
    presence_penalty: llamaConfig.presence_penalty,
    frequency_penalty: llamaConfig.frequency_penalty,
    dry_multiplier: llamaConfig.dry_multiplier,
    dry_base: llamaConfig.dry_base,
    dry_allowed_length: llamaConfig.dry_allowed_length,
    dry_penalty_last_n: llamaConfig.dry_penalty_last_n,
    // Memory & architecture options
    n_cpu_moe: llamaConfig.n_cpu_moe,
    cpu_moe: llamaConfig.cpu_moe,
    tensor_split: llamaConfig.tensor_split,
    split_mode: llamaConfig.split_mode,
    no_mmap: llamaConfig.no_mmap,
    vocab_only: llamaConfig.vocab_only,
    memory_f16: llamaConfig.memory_f16,
    memory_f32: llamaConfig.memory_f32,
    memory_auto: llamaConfig.memory_auto,
    // RoPE scaling
    rope_freq_base: llamaConfig.rope_freq_base,
    rope_freq_scale: llamaConfig.rope_freq_scale,
    yarn_ext_factor: llamaConfig.yarn_ext_factor,
    yarn_attn_factor: llamaConfig.yarn_attn_factor,
    yarn_beta_fast: llamaConfig.yarn_beta_fast,
    yarn_beta_slow: llamaConfig.yarn_beta_slow,
    // Additional advanced options
    penalize_nl: llamaConfig.penalize_nl,
    ignore_eos: llamaConfig.ignore_eos,
    mlock: llamaConfig.mlock,
    numa: llamaConfig.numa,
    memory_mapped: llamaConfig.memory_mapped,
    use_mmap: llamaConfig.use_mmap,
    grp_attn_n: llamaConfig.grp_attn_n,
    grp_attn_w: llamaConfig.grp_attn_w,
    neg_prompt_multiplier: llamaConfig.neg_prompt_multiplier,
    no_kv_offload: llamaConfig.no_kv_offload,
    ml_lock: llamaConfig.ml_lock,
  };

  const llamaService = new LlamaService(llamaServiceConfig);

  // Expose llamaService to global scope for API routes to use
  global.llamaService = llamaService;
  logger.info('✅ [GLOBAL] LlamaService exposed globally for API routes');

  // Store last broadcasted Llama state to avoid duplicate broadcasts
  let lastLlamaState = null;
  let lastBroadcastedModels = null;

  // Helper function to check if data has changed (defined before use)
  const hasDataChanged = (current, last) => {
    if (!last) return true;
    return JSON.stringify(current) !== JSON.stringify(last);
  };

  // Listen to Llama state changes - but only broadcast if state actually changed
  llamaService.onStateChange((state) => {
    // Only check meaningful fields for change detection (not uptime/timestamps)
    const currentStateForComparison = {
      status: state.status,
      modelsCount: state.models ? state.models.length : 0,
      lastError: state.lastError,
      retries: state.retries,
    };

    // Full state to send to clients
    const currentState = {
      status: state.status,
      models: state.models,
      lastError: state.lastError,
      retries: state.retries,
      uptime: state.uptime,
      startedAt: state.startedAt,
    };

    // Only broadcast llama status if meaningful data actually changed
    if (hasDataChanged(currentStateForComparison, lastLlamaState)) {
      lastLlamaState = currentStateForComparison;
      io.emit('llamaStatus', {
        type: 'llama_status',
        data: currentState,
        timestamp: Date.now()
      });
      logger.debug(`📡 [BROADCAST] Llama status update sent (changed): ${state.status}`);
    } else {
      logger.debug(`📡 [BROADCAST] Llama status skipped (no changes)`);
    }
    
    // Also broadcast models immediately when state changes (only if models actually changed)
    if (state.models && state.models.length > 0) {
      const modelsData = state.models.map((model) => ({
        id: model.id || model.name,
        name: model.name,
        type: model.type || 'unknown',
        status: 'available',
        size: model.size,
        createdAt: new Date(model.modified_at * 1000).toISOString(),
        updatedAt: new Date(model.modified_at * 1000).toISOString(),
      }));

      if (hasDataChanged(modelsData, lastBroadcastedModels)) {
        lastBroadcastedModels = modelsData;
        io.emit('models', { type: 'models', data: modelsData, timestamp: Date.now() });
        logger.debug(`📡 [BROADCAST] Models updated via state change (changed): ${modelsData.length} model(s)`);
      } else {
        logger.debug(`📡 [BROADCAST] Models skipped (no changes): ${modelsData.length} model(s)`);
      }
    }
  });

  // Start Llama service
  try {
    logger.info('🚀 [LLAMA] Starting Llama service...');
    await llamaService.start();
    const state = llamaService.getState();
    logger.info(`✅ [LLAMA] Service ready with ${state.models.length} models`);
  } catch (error) {
    logger.error(`❌ [LLAMA] Failed to start service: ${error.message}`);
  }

  // Store connected clients
  const clients = new Map();

  // Store last sent data to detect changes
  let lastMetrics = null;
  let lastModels = null;
  let lastLogs = null;

  // Generate metrics data - get real counts from Llama service
  const generateMetrics = () => {
    const state = llamaService.getState();
    // Count loaded models from the service state
    const loadedModelsCount = state.models ? state.models.length : 0;
    
    return {
      activeModels: loadedModelsCount,
      totalRequests: 0, // Will need real tracking
      avgResponseTime: 0, // Will need real tracking
      memoryUsage: 0, // Will need real system metrics
      cpuUsage: 0, // Will need real system metrics
      uptime: Math.floor((Date.now() - (state.startedAt ? new Date(state.startedAt).getTime() : Date.now())) / 1000),
      lastUpdated: new Date().toISOString()
    };
  };

  // Generate models data - from Llama service only (no mock data)
  const generateModels = () => {
    const state = llamaService.getState();
    if (state.models && state.models.length > 0) {
      return state.models.map((model) => ({
        id: model.id || model.name,
        name: model.name,
        type: model.type || 'unknown',
        status: 'available',
        size: model.size,
        createdAt: new Date(model.modified_at * 1000).toISOString(),
        updatedAt: new Date(model.modified_at * 1000).toISOString(),
      }));
    }
    // Return empty array if no models - no fake data
    return [];
  };

  // Generate logs data - from actual system logs
  const generateLogs = () => {
    // TODO: Integrate with actual log system
    // For now, return empty array instead of fake logs
    return [];
  };

  // Broadcast to all connected clients - only if data changed
  const broadcastMetrics = () => {
    if (clients.size === 0) return;
    
    const metrics = generateMetrics();
    if (hasDataChanged(metrics, lastMetrics)) {
      lastMetrics = metrics;
      io.emit('metrics', { type: 'metrics', data: metrics, timestamp: Date.now() });
      logger.debug(`📊 [BROADCAST] Metrics sent (changed) to ${clients.size} client(s)`);
    } else {
      logger.debug(`📊 [BROADCAST] Metrics skipped (no changes)`);
    }
  };

  const broadcastModels = () => {
    if (clients.size === 0) return;
    
    const models = generateModels();
    if (hasDataChanged(models, lastModels)) {
      lastModels = models;
      io.emit('models', { type: 'models', data: models, timestamp: Date.now() });
      logger.debug(`🤖 [BROADCAST] Models sent (changed) to ${clients.size} client(s)`);
    } else {
      logger.debug(`🤖 [BROADCAST] Models skipped (no changes)`);
    }
  };

  const broadcastLogs = () => {
    if (clients.size === 0) return;
    
    const logs = generateLogs();
    if (hasDataChanged(logs, lastLogs)) {
      lastLogs = logs;
      io.emit('logs', { type: 'logs', data: logs, timestamp: Date.now() });
      logger.debug(`📜 [BROADCAST] Logs sent (changed) to ${clients.size} client(s)`);
    } else {
      logger.debug(`📜 [BROADCAST] Logs skipped (no changes)`);
    }
  };

  // Start broadcast intervals - still check on intervals but only broadcast if data changed
  const metricsInterval = setInterval(broadcastMetrics, UPDATE_CONFIG.METRICS_INTERVAL);
  const modelsInterval = setInterval(broadcastModels, UPDATE_CONFIG.MODELS_INTERVAL);
  const logsInterval = setInterval(broadcastLogs, UPDATE_CONFIG.LOGS_INTERVAL);

  logger.info(`⏱️ [CONFIG] Update intervals: Metrics=${UPDATE_CONFIG.METRICS_INTERVAL/1000}s, Models=${UPDATE_CONFIG.MODELS_INTERVAL/1000}s, Logs=${UPDATE_CONFIG.LOGS_INTERVAL/1000}s`);

  // Handle Socket.IO connections
  io.on('connection', (socket) => {
    const clientId = socket.id;
    clients.set(clientId, socket);
    
    logger.info(`🔌 [SOCKET.IO] New client connected (ID: ${clientId}) - Total clients: ${clients.size}`);

    // Send welcome message with Llama status
    const llamaState = llamaService.getState();
    socket.emit('message', {
      type: 'connection',
      clientId,
      message: 'Connected to Socket.IO server',
      llamaStatus: llamaState.status,
      timestamp: new Date().toISOString()
    });

    // Send initial real data immediately to new client
    const initialMetrics = generateMetrics();
    const initialModels = generateModels();
    const initialLogs = generateLogs();
    
    socket.emit('metrics', { type: 'metrics', data: initialMetrics, timestamp: Date.now() });
    socket.emit('models', { type: 'models', data: initialModels, timestamp: Date.now() });
    socket.emit('logs', { type: 'logs', data: initialLogs, timestamp: Date.now() });
    socket.emit('llamaStatus', {
      type: 'llama_status',
      data: {
        status: llamaState.status,
        models: llamaState.models,
        lastError: llamaState.lastError,
        retries: llamaState.retries,
        uptime: llamaState.uptime,
        startedAt: llamaState.startedAt,
      },
      timestamp: Date.now()
    });

    // Handle incoming messages
    socket.on('message', (data) => {
      try {
        logger.info(`💬 [SOCKET.IO] Message received: ${data.type || 'unknown'}`);
        socket.broadcast.emit('message', data);
      } catch (error) {
        logger.error(`❌ [SOCKET.IO] Error processing message: ${error.message}`);
      }
    });

    // Handle on-demand requests (for manual refresh)
    socket.on('requestMetrics', () => {
      logger.debug(`📊 [SOCKET.IO] Metrics requested by client ${clientId}`);
      socket.emit('metrics', { type: 'metrics', data: generateMetrics(), timestamp: Date.now() });
    });

    socket.on('requestModels', () => {
      logger.debug(`🤖 [SOCKET.IO] Models requested by client ${clientId}`);
      socket.emit('models', { type: 'models', data: generateModels(), timestamp: Date.now() });
    });

    socket.on('requestLogs', () => {
      logger.debug(`📜 [SOCKET.IO] Logs requested by client ${clientId}`);
      socket.emit('logs', { type: 'logs', data: generateLogs(), timestamp: Date.now() });
    });

    // Handle Llama status requests
    socket.on('requestLlamaStatus', () => {
      logger.debug(`🦙 [SOCKET.IO] Llama status requested by client ${clientId}`);
      const state = llamaService.getState();
      socket.emit('llamaStatus', {
        type: 'llama_status',
        data: {
          status: state.status,
          models: state.models,
          lastError: state.lastError,
          retries: state.retries,
          uptime: state.uptime,
          startedAt: state.startedAt,
        },
        timestamp: Date.now()
      });
    });

    // Handle client disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`🔴 [SOCKET.IO] Client disconnected (ID: ${clientId}) | Reason: ${reason} - Remaining clients: ${clients.size - 1}`);
      clients.delete(clientId);
    });

    socket.on('connect_error', (error) => {
      logger.error(`❌ [SOCKET.IO] Connection error for client ${clientId}: ${error.message}`);
    });
  });

  expressApp.use((req, res) => {
    return nextHandler(req, res)
  })

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
    logger.info(`🚀 [SOCKET.IO] Server listening at http://${hostname}:${port}`);
    logger.info('🚀 [SOCKET.IO] Socket.IO server is ready - updates will be pushed automatically');
  })

  server.on('error', (error) => {
    logger.error(`❌ [SOCKET.IO] HTTP Server error: ${error.message}`);
    if (error.code === 'EADDRINUSE') {
      logger.error(`🔥 [SOCKET.IO] Port ${port} is already in use!`);
    }
  });

  io.engine.on('connection_error', (err) => {
    logger.error(`❌ [SOCKET.IO] Connection error: ${err.message}`);
  });

  // Cleanup on shutdown
  const cleanup = async () => {
    logger.info('👋 [SHUTDOWN] Starting graceful shutdown...');
    clearInterval(metricsInterval);
    clearInterval(modelsInterval);
    clearInterval(logsInterval);
    
    try {
      await llamaService.stop();
    } catch (error) {
      logger.error(`Error stopping Llama service: ${error.message}`);
    }
    
    io.disconnectSockets();
    server.close(() => {
      logger.info('👋 [SHUTDOWN] Server shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);

}).catch((error) => {
  logger.error(`❌ [SOCKET.IO] Failed to prepare Next.js app: ${error.message}`);
  process.exit(1);
});
