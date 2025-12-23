import { createServer } from 'http';
import next from 'next';
import { Server as IOServer } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Whitelist origins from environment variable
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// Whitelist allowed model IDs for control messages
const allowedModelIds = (process.env.ALLOWED_MODEL_IDS ?? '')
  .split(',')
  .map(id => id.trim())
  .filter(Boolean);

const app = next({ dev });
const handler = app.getRequestHandler();

const httpServer = createServer((req, res) => {
  handler(req, res);
});

const io = new IOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'));
      }
    },
  },
});

io.on('connection', (socket) => {
  if (dev) {
    console.log(`> WebSocket client connected: ${socket.id}`);
  }

  // Handle startModel with validation
  socket.on('startModel', (data: { modelId: string }) => {
    if (!data?.modelId) return;
    if (!allowedModelIds.includes(data.modelId)) {
      if (dev) {
        console.log(`[dev] Blocked startModel for disallowed model ID: ${data.modelId}`);
      }
      socket.emit('error', 'Model ID not allowed');
      socket.disconnect();
      return;
    }
    if (dev) {
      console.log(`> Starting model: ${data.modelId}`);
    }
  });

  // Handle stopModel with validation
  socket.on('stopModel', (data: { modelId: string }) => {
    if (!data?.modelId) return;
    if (!allowedModelIds.includes(data.modelId)) {
      if (dev) {
        console.log(`[dev] Blocked stopModel for disallowed model ID: ${data.modelId}`);
      }
      socket.emit('error', 'Model ID not allowed');
      socket.disconnect();
      return;
    }
    if (dev) {
      console.log(`> Stopping model: ${data.modelId}`);
    }
  });

  socket.on('disconnect', (reason) => {
    if (dev) {
      console.log(`> WebSocket client disconnected: ${socket.id} (${reason})`);
    }
  });
});

// Add error handling for HTTP server
httpServer.on('error', (error: Error) => {
  if (dev) {
    console.error('Server error:', error);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  if (dev) {
    console.log('SIGTERM received. Shutting down gracefully...');
  }
  io.close();
  httpServer.close(() => {
    process.exit(0);
  });
});

httpServer.listen(port, () => {
  if (dev) {
    console.log(`> Server listening at http://${hostname}:${port} as ${process.env.NODE_ENV}`);
    console.log(`> WebSocket server running on ws://${hostname}:${port}/api/websocket`);
  }
});

export {};