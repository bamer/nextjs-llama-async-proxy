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
  LLAMA_STATUS_INTERVAL: 5000, // 5 secondes pour le statut Llama
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
    // Pass all other configuration options
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
  };

  const llamaService = new LlamaService(llamaServiceConfig);

  // Listen to Llama state changes and broadcast to clients
  llamaService.onStateChange((state) => {
    io.emit('llamaStatus', {
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
    logger.debug(`📡 [BROADCAST] Llama status update sent: ${state.status}`);
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

  // Generate metrics data (in real app, this would come from actual system)
  const generateMetrics = () => ({
    activeModels: Math.floor(Math.random() * 5) + 1,
    totalRequests: Math.floor(Math.random() * 500) + 100,
    avgResponseTime: Math.floor(Math.random() * 300) + 100,
    memoryUsage: Math.floor(Math.random() * 30) + 50,
    cpuUsage: Math.floor(Math.random() * 50) + 20,
    uptime: Math.floor(Date.now() / 1000),
    lastUpdated: new Date().toISOString()
  });

  // Generate models data - now from Llama service
  const generateModels = () => {
    const state = llamaService.getState();
    if (state.models.length > 0) {
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
    // Fallback if no models loaded yet
    return [
      { id: 'loading', name: 'Loading models...', type: 'loading', status: 'loading', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
  };

  // Generate logs data
  const generateLogs = () => {
    const logLevels = ['info', 'debug', 'warn', 'error'];
    const logs = [];
    const now = Date.now();
    
    for (let i = 0; i < 10; i++) {
      const level = logLevels[Math.floor(Math.random() * logLevels.length)];
      logs.push({
        id: `log-${now}-${i}`,
        level,
        message: `Log message ${i + 1} from ${level}`,
        timestamp: new Date(now - Math.floor(Math.random() * 300000)).toISOString(),
        context: { source: 'server' }
      });
    }
    return logs;
  };

  // Broadcast to all connected clients
  const broadcastMetrics = () => {
    if (clients.size === 0) return;
    
    const metrics = generateMetrics();
    io.emit('metrics', { type: 'metrics', data: metrics, timestamp: Date.now() });
    logger.debug(`📊 [BROADCAST] Metrics sent to ${clients.size} client(s)`);
  };

  const broadcastModels = () => {
    if (clients.size === 0) return;
    
    const models = generateModels();
    io.emit('models', { type: 'models', data: models, timestamp: Date.now() });
    logger.debug(`🤖 [BROADCAST] Models sent to ${clients.size} client(s)`);
  };

  const broadcastLogs = () => {
    if (clients.size === 0) return;
    
    const logs = generateLogs();
    io.emit('logs', { type: 'logs', data: logs, timestamp: Date.now() });
    logger.debug(`📜 [BROADCAST] Logs sent to ${clients.size} client(s)`);
  };

  // Start broadcast intervals
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

    // Send initial data immediately to new client
    socket.emit('metrics', { type: 'metrics', data: generateMetrics(), timestamp: Date.now() });
    socket.emit('models', { type: 'models', data: generateModels(), timestamp: Date.now() });
    socket.emit('logs', { type: 'logs', data: generateLogs(), timestamp: Date.now() });
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
