// server.js - Serveur principal avec Socket.IO
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import express from 'express';

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

logger.info('🚀 [SOCKET.IO] Initializing Socket.IO server...');

app.prepare().then(() => {
  logger.info('✅ [SOCKET.IO] Next.js app prepared, starting HTTP server...');
  
const expressApp = express();
const server = createServer();

  // Create Socket.IO server with CORS configuration
  const io = new Server({
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
  io.attach(server);
  logger.info('🔧 [SOCKET.IO] Socket.IO server configured with path: /llamaproxws');

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

  // Generate models data
  const generateModels = () => [
    { id: 'llama-2-7b', name: 'Llama 2 7B', type: 'llama', status: 'running', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'llama-2-13b', name: 'Llama 2 13B', type: 'llama', status: 'stopped', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'mistral-7b', name: 'Mistral 7B', type: 'mistral', status: 'running', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

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

    // Send welcome message
    socket.emit('message', {
      type: 'connection',
      clientId,
      message: 'Connected to Socket.IO server',
      timestamp: new Date().toISOString()
    });

    // Send initial data immediately to new client
    socket.emit('metrics', { type: 'metrics', data: generateMetrics(), timestamp: Date.now() });
    socket.emit('models', { type: 'models', data: generateModels(), timestamp: Date.now() });
    socket.emit('logs', { type: 'logs', data: generateLogs(), timestamp: Date.now() });

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

    // Handle client disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`🔴 [SOCKET.IO] Client disconnected (ID: ${clientId}) | Reason: ${reason} - Remaining clients: ${clients.size - 1}`);
      clients.delete(clientId);
    });

    socket.on('connect_error', (error) => {
      logger.error(`❌ [SOCKET.IO] Connection error for client ${clientId}: ${error.message}`);
    });
  });

  server.on('request', expressApp)
 
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
  const cleanup = () => {
    clearInterval(metricsInterval);
    clearInterval(modelsInterval);
    clearInterval(logsInterval);
    io.disconnectSockets();
    server.close(() => {
      logger.info('👋 [SOCKET.IO] Server shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);

}).catch((error) => {
  logger.error(`❌ [SOCKET.IO] Failed to prepare Next.js app: ${error.message}`);
  process.exit(1);
});
