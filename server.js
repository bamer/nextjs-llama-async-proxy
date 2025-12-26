import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';
import express from 'express';
import LlamaServerIntegration from './src/server/services/LlamaServerIntegration.js';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const nextHandler = app.getRequestHandler()
const hostname = 'localhost';
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  debug: (...args) => console.debug('[DEBUG]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args)
};

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
    console.log(`> Ready on http://${hostname}:${port}`)
    logger.info(`🚀 [SOCKET.IO] Server listening at http://${hostname}:${port}`);
    logger.info('🚀 [SOCKET.IO] Socket.IO server is ready');

    const llamaConfig = {
      host: process.env.LLAMA_SERVER_HOST || 'localhost',
      port: parseInt(process.env.LLAMA_SERVER_PORT || '8134', 10),
      basePath: process.env.MODELS_PATH || '/models',
      ctx_size: 8192,
      batch_size: 512,
      threads: -1,
      gpu_layers: -1,
    };

    try {
      logger.info('🦙 Initializing LlamaServer integration...');
      await llamaIntegration.initialize(llamaConfig);
      
      global.llamaService = llamaIntegration.getLlamaService();
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

}).catch((error) => {
  logger.error(`❌ [SOCKET.IO] Failed to prepare Next.js app: ${error.message}`);
  process.exit(1);
});
