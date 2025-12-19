const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    path: '/api/websocket',
    addTrailingSlash: false,
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send initial status
    socket.emit('status', {
      connected: true,
      clients: io.engine.clientsCount,
      uptime: process.uptime(),
      timestamp: Date.now()
    });

    // Handle metrics request
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

    // Handle logs request
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

    // Periodic status updates
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
});