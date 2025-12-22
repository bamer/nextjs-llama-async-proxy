import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

async function startServer() {
  const app = next({ dev, hostname, port });
  await app.prepare();
  const handle = app.getRequestHandler();

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    
    // Let Next.js handle HMR and static files directly
    if (req.url && (req.url.startsWith('/_next/') || 
                   req.url === '/favicon.ico' ||
                   req.url === '/site.webmanifest')) {
      return app.getRequestHandler()(req, res, parsedUrl);
    }
    
    // 🚨 PUBLIC ACCESS: No authentication, all connections allowed
    console.log(`[PUBLIC_SERVER] ${req.method} ${req.url}`);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    // 🚨 PUBLIC WEBSOCKET: No authentication required
    allowRequest: (req, callback) => {
      console.log(`[PUBLIC_WS_CONNECTION] ${req.headers.origin || 'unknown'}`);
      callback(null, true); // Always allow connection
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.emit('status', {
      connected: true,
      clients: io.engine.clientsCount,
      uptime: process.uptime(),
      timestamp: Date.now()
    });

    socket.on('getMetrics', () => {
      const metrics = {
        activeModels: Math.floor(Math.random() * 5) + 1,
        totalRequests: Math.floor(Math.random() * 500) + 100,
        avgResponseTime: Math.floor(Math.random() * 300) + 100,
        memoryUsage: Math.floor(Math.random() * 30) + 50,
        cpuUsage: Math.floor(Math.random() * 50) + 20,
        lastUpdated: new Date().toISOString()
      };
      socket.emit('metrics', { type: 'metrics', data: metrics, timestamp: Date.now() });
    });

    socket.on('getLogs', () => {
      const logLevels = ['info', 'debug', 'warn', 'error'];
      const logMessages = {
        info: ['Model loaded successfully', 'WebSocket connection established', 'Request processed', 'New session started'],
        debug: ['Processing request batch', 'Model parameters updated', 'Memory optimized', 'CPU usage monitored'],
        warn: ['High memory usage detected', 'Slow response time', 'Model near capacity'],
        error: ['Failed to load model', 'Connection timeout', 'Invalid request format']
      };

      const logs = [];
      const now = Date.now();
      const logCount = Math.floor(Math.random() * 6) + 5;
      for (let i = 0; i < logCount; i++) {
        const level = logLevels[Math.floor(Math.random() * logLevels.length)];
        const messages = logMessages[level];
        const message = messages[Math.floor(Math.random() * messages.length)];
        logs.push({
          level,
          message,
          timestamp: now - Math.floor(Math.random() * 300000)
        });
      }
      socket.emit('logs', { type: 'logs', data: logs, timestamp: Date.now() });
    });

    const interval = setInterval(() => {
      socket.emit('status', {
        connected: true,
        clients: io.engine.clientsCount,
        uptime: process.uptime(),
        timestamp: Date.now()
      });
    }, 30000);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      clearInterval(interval);
    });
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});