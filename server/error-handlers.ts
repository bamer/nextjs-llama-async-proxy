import { Server } from 'socket.io';
import type LlamaServerIntegration from '../src/server/services/LlamaServerIntegration';
import { getLogger } from '../src/lib/logger';

const logger = getLogger();

export function setupErrorHandlers(
  server: ReturnType<typeof import('http').createServer>,
  io: Server,
  llamaIntegration: LlamaServerIntegration,
  port: number,
): void {
  server.on('error', (error: Error & { code?: string }) => {
    logger.error(`❌ [SOCKET.IO] HTTP Server error: ${error.message}`);
    if (error.code === 'EADDRINUSE') {
      logger.error(`🔥 [SOCKET.IO] Port ${port} is already in use!`);
    }
  });

  io.engine.on('connection_error', (err: Error) => {
    logger.error(`❌ [SOCKET.IO] Connection error: ${err.message}`);
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('❌ [UNCAUGHT EXCEPTION]', error);
    cleanup(io, llamaIntegration, server);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('❌ [UNHANDLED REJECTION]', reason);
    cleanup(io, llamaIntegration, server);
  });
}

export function setupShutdownHandlers(
  io: Server,
  llamaIntegration: LlamaServerIntegration,
  server: ReturnType<typeof import('http').createServer>,
): void {
  const cleanupHandler = async () => {
    await cleanup(io, llamaIntegration, server);
  };

  process.on('SIGTERM', cleanupHandler);
  process.on('SIGINT', cleanupHandler);
  process.on('exit', (code: number) => {
    logger.info(`👋 [SHUTDOWN] Server exited with code ${code}`);
  });
}

async function cleanup(
  io: Server,
  llamaIntegration: LlamaServerIntegration,
  server: ReturnType<typeof import('http').createServer>,
): Promise<void> {
  logger.info('👋 [SHUTDOWN] Starting graceful shutdown...');
  io.disconnectSockets();
  await llamaIntegration.stop();
  server.close(() => {
    logger.info('👋 [SHUTDOWN] Server shutdown complete');
    process.exit(0);
  });
}
