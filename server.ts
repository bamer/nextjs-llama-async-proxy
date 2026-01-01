import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';
import express from 'express';
import { registry } from './src/server/ServiceRegistry';
import { setSocketIOInstance, getLogger } from './src/lib/logger';
import LlamaServerIntegration from './src/server/services/LlamaServerIntegration';
import { setupSocketHandlers } from './server/socket-handlers';
import { loadLlamaConfig } from './server/config-loader';
import { tryAutoImport } from './server/auto-import';
import { setupErrorHandlers, setupShutdownHandlers } from './server/error-handlers';

const logger = getLogger();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const nextHandler = app.getRequestHandler();
const hostname = 'localhost';
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

(global as any).registry = registry;

logger.info('🚀 [SOCKET.IO] Initializing Socket.IO server...');

app
  .prepare()
  .then(() => {
    logger.info('✅ [SOCKET.IO] Next.js app prepared, starting HTTP server...');

    const expressApp = express();
    const server = createServer(expressApp);

    const io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
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

    setSocketIOInstance(io);
    logger.info('🔧 [LOGGER] Socket.IO instance registered for WebSocket transport');

    const llamaIntegration = new LlamaServerIntegration(io);

    setupSocketHandlers(io, llamaIntegration);

    expressApp.use((req, res) => {
      return nextHandler(req, res);
    });

    server.listen(port, async () => {
      logger.info(`> Ready on http://${hostname}:${port}`);
      logger.info(`🚀 [SOCKET.IO] Server listening at http://${hostname}:${port}`);
      logger.info('🚀 [SOCKET.IO] Socket.IO server is ready');

      const llamaConfig = loadLlamaConfig();

      try {
        logger.info('🦙 Initializing LlamaServer integration...');
        logger.info(`📋 [CONFIG] Llama server path: ${llamaConfig.serverPath}`);
        logger.info(`📋 [CONFIG] Host: ${llamaConfig.host}:${llamaConfig.port}`);
        logger.info(`📋 [CONFIG] Base path: ${llamaConfig.basePath}`);
        logger.info(
          `📋 [CONFIG] ctx_size: ${llamaConfig.ctx_size}, batch_size: ${llamaConfig.batch_size}, threads: ${llamaConfig.threads}`,
        );
        await llamaIntegration.initialize(llamaConfig);

        registry.register('llamaService', llamaIntegration.getLlamaService());
        logger.info('✅ LlamaServer integration initialized successfully');

        try {
          await tryAutoImport(llamaIntegration, llamaConfig, 5);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          logger.warn(`⚠️ [AUTO-IMPORT] Failed to check/import models after all retries: ${message}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`❌ Failed to initialize LlamaServer integration: ${message}`);
        logger.warn('⚠️ Server will continue running, but model management may not work');
      }
    });

    setupErrorHandlers(server, io, llamaIntegration, port);
    setupShutdownHandlers(io, llamaIntegration, server);
  })
  .catch((error: Error) => {
    logger.error(`❌ [SOCKET.IO] Failed to prepare Next.js app: ${error.message}`);
    process.exit(1);
  });
