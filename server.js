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

logger.info('🚀 [SOCKET.IO] Initializing Socket.IO server...');

app.prepare().then(() => {
  logger.info('✅ [SOCKET.IO] Next.js app prepared, starting HTTP server...');
  
const expressApp = express();
const server = createServer();

  // Create Socket.IO server with CORS configuration
  const io = new Server({
    cors: {
      origin: '*', // Allow all origins for development
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
    // Socket.IO specific options
    path: '/llamaproxws',
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
    maxHttpBufferSize: 1e8, // 100MB
    transports: ['websocket'], // Fallback to polling if WebSocket fails
  });
  io.attach(server);
  logger.info('🔧 [SOCKET.IO] Socket.IO server configured with path: /llamaproxws');

  // Store connected clients
  const clients = new Map();

  // Handle Socket.IO connections
  io.on('connection', (socket) => {
    const clientId = socket.id;
    clients.set(clientId, socket);
    
    logger.info(`🔌 [SOCKET.IO] New client connected (ID: ${clientId})`);
    logger.debug(`📡 [SOCKET.IO] Connection from: ${socket.handshake.address}`);
    logger.debug(`📊 [SOCKET.IO] Transport: ${socket.conn.transport.name}`);
    logger.debug(`🔗 [SOCKET.IO] Headers:`, socket.handshake.headers);

    // Send welcome message
    socket.emit('message', {
      type: 'connection',
      clientId,
      message: 'Connected to Socket.IO server',
      timestamp: new Date().toISOString()
    });

    // Handle incoming messages
    socket.on('message', (data) => {
      try {
        logger.info(`💬 [SOCKET.IO] Message received: ${data.type || 'unknown'}`);
        logger.debug(`📝 [SOCKET.IO] Full message:`, data);
        
        // Broadcast to all connected clients except sender
        socket.broadcast.emit('message', data);
      } catch (error) {
        logger.error(`❌ [SOCKET.IO] Error processing message: ${error.message}`);
      }
    });

    // Handle specific events
    socket.on('requestMetrics', () => {
      logger.info(`📊 [SOCKET.IO] Metrics requested by client ${clientId}`);
      
      // Generate mock metrics data
      const metrics = {
        activeModels: Math.floor(Math.random() * 5) + 1,
        totalRequests: Math.floor(Math.random() * 500) + 100,
        avgResponseTime: Math.floor(Math.random() * 300) + 100,
        memoryUsage: Math.floor(Math.random() * 30) + 50,
        cpuUsage: Math.floor(Math.random() * 50) + 20,
        lastUpdated: new Date().toISOString()
      };
      
      socket.emit('metrics', {
        type: 'metrics',
        data: metrics,
        timestamp: Date.now()
      });
    });

    socket.on('requestModels', () => {
      logger.info(`🤖 [SOCKET.IO] Models requested by client ${clientId}`);
      
      // Generate mock models data
      const models = [
        { id: 'llama-2-7b', name: 'Llama 2 7B', status: 'running', load: Math.random() },
        { id: 'llama-2-13b', name: 'Llama 2 13B', status: 'stopped', load: 0 },
        { id: 'mistral-7b', name: 'Mistral 7B', status: 'running', load: Math.random() },
      ];
      
      socket.emit('models', {
        type: 'models',
        data: models,
        timestamp: Date.now()
      });
    });

    socket.on('requestLogs', () => {
      logger.info(`📜 [SOCKET.IO] Logs requested by client ${clientId}`);
      
      // Generate mock logs data
      const logLevels = ['info', 'debug', 'warn', 'error'];
      const logs = [];
      const now = Date.now();
      
      for (let i = 0; i < 10; i++) {
        const level = logLevels[Math.floor(Math.random() * logLevels.length)];
        logs.push({
          level,
          message: `Log message ${i + 1} from ${level}`,
          timestamp: now - Math.floor(Math.random() * 300000)
        });
      }
      
      socket.emit('logs', {
        type: 'logs',
        data: logs,
        timestamp: Date.now()
      });
    });

    // Handle client disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`🔴 [SOCKET.IO] Client disconnected (ID: ${clientId}) | Reason: ${reason}`);
      clients.delete(clientId);
      
      // Notify others
      socket.broadcast.emit('user_disconnected', {
        type: 'user_disconnected',
        senderId: clientId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle errors
    socket.on('connect_error', (error) => {
      logger.error(`❌ [SOCKET.IO] Connection error for client ${clientId}: ${error.message}`);
    });
  });


  server.on('request', expressApp)
  // Handle all requests with Next.js
 
  expressApp.use((req, res) => {
    return nextHandler(req, res)
  })

  // Start the server!
  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
    logger.info(`🚀 [SOCKET.IO] Server listening at http://${hostname}:${port}`);
    logger.info(`🔌 [SOCKET.IO] Socket.IO server running on ws://${hostname}:${port}/socket.io`);
    logger.info('🚀 [SOCKET.IO] Socket.IO server is ready and waiting for connections...');
  })

  // Server error handling
  server.on('error', (error) => {
    logger.error(`❌ [SOCKET.IO] HTTP Server error: ${error.message}`);
    if (error.code === 'EADDRINUSE') {
      logger.error(`🔥 [SOCKET.IO] Port ${port} is already in use!`);
    }
  });

  // Handle Socket.IO errors
  io.engine.on('connection_error', (err) => {
    logger.error(`❌ [SOCKET.IO] Connection error: ${err.message}`);
    logger.debug('Connection error details:', err);
  });

  // Handle process termination
  process.on('SIGTERM', () => {
    logger.info('🛑 [SOCKET.IO] SIGTERM received. Shutting down gracefully...');
    
    // Disconnect all clients
    io.disconnectSockets();
    
    server.close(() => {
      logger.info('👋 [SOCKET.IO] Server shutdown complete');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('🛑 [SOCKET.IO] SIGINT received. Shutting down gracefully...');
    
    // Disconnect all clients
    io.disconnectSockets();
    
    server.close(() => {
      logger.info('👋 [SOCKET.IO] Server shutdown complete');
      process.exit(0);
    });
  });
}).catch((error) => {
  logger.error(`❌ [SOCKET.IO] Failed to prepare Next.js app: ${error.message}`);
  process.exit(1);
});