import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';
import express from 'express';
import LlamaServerIntegration from './src/server/services/LlamaServerIntegration.ts';
import { registry } from './src/server/ServiceRegistry.ts';
import { loadConfig } from './src/lib/server-config.ts';
import { setSocketIOInstance, getLogger } from './src/lib/logger.ts';

const logger = getLogger();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const nextHandler = app.getRequestHandler()
const hostname = 'localhost';
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Make registry available globally for API routes
global.registry = registry;

logger.info('🚀 [SOCKET.IO] Initializing Socket.IO server...');

app.prepare().then(() => {
  logger.info('✅ [SOCKET.IO] Next.js app prepared, starting HTTP server...');

  const expressApp = express();
  const server = createServer(expressApp);

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

  // Set Socket.IO instance in Winston logger for real-time log streaming
  setSocketIOInstance(io);
  logger.info('🔧 [LOGGER] Socket.IO instance registered for WebSocket transport');

  const llamaIntegration = new LlamaServerIntegration(io);

  const clients = new Map();

  io.on('connection', (socket) => {
    const clientId = socket.id;
    clients.set(clientId, socket);

    logger.info(`🔌 [SOCKET.IO] New client connected (ID: ${clientId}) - Total clients: ${clients.size}`);

    socket.emit('message', {
      type: 'connection',
      clientId,
      message: 'Connected to Socket.IO server',
      timestamp: new Date().toISOString()
    });

    llamaIntegration.setupWebSocketHandlers(socket);

    socket.on('message', (data) => {
      try {
        logger.info(`💬 [SOCKET.IO] Message received: ${data.type || 'unknown'}`);
        socket.broadcast.emit('message', data);
      } catch (error) {
        logger.error(`❌ [SOCKET.IO] Error processing message: ${error.message}`);
      }
    });

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
  });

  server.listen(port, async (err) => {
    if (err) throw err
    logger.info(`> Ready on http://${hostname}:${port}`);
    logger.info(`🚀 [SOCKET.IO] Server listening at http://${hostname}:${port}`);
    logger.info('🚀 [SOCKET.IO] Socket.IO server is ready');

    // Load configuration from llama-server-config.json
    let llamaConfig;
    try {
      const loadedConfig = loadConfig();
      llamaConfig = {
        host: process.env.LLAMA_SERVER_HOST || loadedConfig.host,
        port: parseInt(process.env.LLAMA_SERVER_PORT || String(loadedConfig.port), 10),
        basePath: process.env.MODELS_PATH || loadedConfig.basePath,
        serverPath: loadedConfig.serverPath,
        ctx_size: loadedConfig.ctx_size,
        batch_size: loadedConfig.batch_size,
        threads: loadedConfig.threads,
        gpu_layers: loadedConfig.gpu_layers,
      };
      logger.info('📝 [CONFIG] Configuration loaded from llama-server-config.json');
    } catch (error) {
      logger.warn(`⚠️ [CONFIG] Failed to load config file, using defaults: ${error.message}`);
      llamaConfig = {
        host: process.env.LLAMA_SERVER_HOST || 'localhost',
        port: parseInt(process.env.LLAMA_SERVER_PORT || '8134', 10),
        basePath: process.env.MODELS_PATH || '/models',
        serverPath: '/home/bamer/llama.cpp/build/bin/llama-server',
        ctx_size: 8192,
        batch_size: 512,
        threads: -1,
        gpu_layers: -1,
      };
    }

    try {
      logger.info('🦙 Initializing LlamaServer integration...');
      logger.info(`📋 [CONFIG] Llama server path: ${llamaConfig.serverPath}`);
      logger.info(`📋 [CONFIG] Host: ${llamaConfig.host}:${llamaConfig.port}`);
      logger.info(`📋 [CONFIG] Base path: ${llamaConfig.basePath}`);
      await llamaIntegration.initialize(llamaConfig);

      registry.register('llamaService', llamaIntegration.getLlamaService());
      logger.info('✅ LlamaServer integration initialized successfully');
    } catch (error) {
      logger.error(`❌ Failed to initialize LlamaServer integration: ${error.message}`);
      logger.warn('⚠️ Server will continue running, but model management may not work');
    }
  });

  server.on('error', (error) => {
    logger.error(`❌ [SOCKET.IO] HTTP Server error: ${error.message}`);
    if (error.code === 'EADDRINUSE') {
      logger.error(`🔥 [SOCKET.IO] Port ${port} is already in use!`);
    }
  });

  io.engine.on('connection_error', (err) => {
    logger.error(`❌ [SOCKET.IO] Connection error: ${err.message}`);
  });

  const cleanup = async () => {
    logger.info('👋 [SHUTDOWN] Starting graceful shutdown...');
    io.disconnectSockets();
    await llamaIntegration.stop();
    server.close(() => {
      logger.info('👋 [SHUTDOWN] Server shutdown complete');
      process.exit(0);
    });
  };

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
process.on('exit', (code) => {
  logger.info(`👋 [SHUTDOWN] Server exited with code ${code}`);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ [UNCAUGHT EXCEPTION]', error);
  cleanup();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ [UNHANDLED REJECTION]', reason);
  cleanup();
});

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);

}).catch((error) => {
  logger.error(`❌ [SOCKET.IO] Failed to prepare Next.js app: ${error.message}`);
  process.exit(1);
});
