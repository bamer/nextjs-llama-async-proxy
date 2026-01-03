 
import { Socket, Server as SocketIOServer } from 'socket.io';
import LlamaServerIntegration from '../src/server/services/LlamaServerIntegration';
import { getLogger } from '../src/lib/logger';
import { setupConnectionHandlers } from './connection-handler';
import { setupMetricsHandlers } from './metrics-handler';
import { setupLogsHandlers } from './logs-handler';

const logger = getLogger();

export function setupSocketHandlers(
  io: SocketIOServer,
  llamaIntegration: LlamaServerIntegration,
): void {
  io.on('connection', (socket: Socket) => {
    const clientId = socket.id;
    logger.info(`🔌 [SOCKET.IO] New client connected (ID: ${clientId})`);

    socket.emit('message', {
      type: 'connection',
      clientId,
      message: 'Connected to Socket.IO server',
      timestamp: new Date().toISOString(),
    });

    llamaIntegration.setupWebSocketHandlers(socket);
    setupConnectionHandlers(socket, llamaIntegration);
    setupMetricsHandlers(socket);
    setupLogsHandlers(socket);
  });
}
