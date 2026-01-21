import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import { verifyToken, hasPermission } from '../../src/lib/auth';
import { User, Permission } from '../../src/lib/types';

export type NextApiResponseServerIo = NextApiResponse & {
  socket: any & {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

const ioHandler = (_req: NextApiRequest, res: NextApiResponseServerIo) => {
  if (!res.socket.server.io) {
    console.log('*First use, starting Socket.IO server...');

    const io = new ServerIO(res.socket.server, {
      path: '/api/websocket',
      addTrailingSlash: false,
    });

    // Authentication middleware for Socket.IO
    io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
          console.log('WebSocket connection rejected: No token provided');
          return next(new Error('Authentication token required'));
        }

        const decoded = verifyToken(token);
        if (!decoded) {
          console.log('WebSocket connection rejected: Invalid token');
          return next(new Error('Invalid or expired token'));
        }

        // Check if user has WebSocket connection permission
        if (!hasPermission(decoded.permissions, Permission.WEBSOCKET_CONNECT)) {
          console.log('WebSocket connection rejected: Insufficient permissions');
          return next(new Error('Insufficient permissions for WebSocket connection'));
        }

        // Attach user info to socket
        socket.data.user = {
          id: decoded.userId,
          username: decoded.username,
          email: decoded.email,
          role: decoded.role,
          permissions: decoded.permissions
        } as User;

        console.log(`Authenticated WebSocket connection: ${decoded.username} (${socket.id})`);
        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    io.on('connection', (socket) => {
      const user = socket.data.user as User;
      console.log(`Client connected: ${user.username} (${socket.id})`);

      // Send initial data
      socket.emit('status', {
        connected: true,
        clients: io.engine.clientsCount,
        uptime: process.uptime(),
        timestamp: Date.now(),
        user: {
          username: user.username,
          role: user.role
        }
      });

      // Handle metrics request
      socket.on('getMetrics', () => {
        // Check if user has permission to read monitoring data
        if (!hasPermission(user.permissions, Permission.MONITORING_READ)) {
          socket.emit('error', { message: 'Insufficient permissions to access metrics' });
          return;
        }

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
        // Check if user has permission to read logs
        if (!hasPermission(user.permissions, Permission.MONITORING_READ)) {
          socket.emit('error', { message: 'Insufficient permissions to access logs' });
          return;
        }
        const logLevels = ['info', 'debug', 'warn', 'error'] as const;
        const logMessages: Record<string, string[]> = {
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

      // Periodic updates
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

    res.socket.server.io = io;
  } else {
    console.log('Socket.IO server already running');
  }
  res.end();
};

export default ioHandler;