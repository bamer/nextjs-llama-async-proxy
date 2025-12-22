import { any } from "zod";

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer } = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req: any, res: any) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Create WebSocket server
  const wss = new WebSocketServer({
    server,
    path: '/api/ws' // WebSocket endpoint
  });

  // Store connected clients
  const clients = new Map();

  wss.on('connection', (ws: any, req: any) => {
    console.log('New client connected');

    // Generate unique ID for this connection
    const clientId = Math.random().toString(36).substring(7);
    clients.set(clientId, ws);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      clientId,
      message: 'Connected to WebSocket server'
    }));

    // Handle incoming messages
    ws.on('message', (data: any) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Received:', message);

        // Broadcast to all connected clients
        broadcast(message, clientId);
      } catch (error) {
        console.error('Invalid message format:', error);
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      console.log('Client disconnected:', clientId);
      clients.delete(clientId);

      // Notify others
      broadcast({
        type: 'user_disconnected',
        senderId: clientId
      }, clientId);
    });

    // Handle errors
    ws.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });
  });

  // Broadcast message to all clients except sender
  function broadcast(message: any, senderId: any) {
    const messageStr = JSON.stringify(message);

    clients.forEach((client, id) => {
      if (client.readyState === WebSocket.OPEN && id !== senderId) {
        client.send(messageStr);
      }
    });
  }

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err:any) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
    console.log(`> WebSocket server on ws://localhost:${PORT}/api/ws`);
  });
});