const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer } = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const hostname = 'localhost';
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.prepare().then(() => {
  const server = createServer((req: any, res: any) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Create WebSocket server
  const wss = new WebSocketServer({
    server,
    path: '/api/websocket' // WebSocket endpoint
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

    ws.on('disconnect', (reason: any) => {
      if (dev) {
        console.log(`> WebSocket client disconnected: ${ws.id} (${reason})`);
      }
    });

    ws.on('startModel', (data: { modelId: string }) => {
      if (!data?.modelId) return;
      console.log(`> Starting model: ${data.modelId}`);
      ws.emit('startModel', data);
    });

    ws.on('stopModel', (data: { modelId: string }) => {
      if (!data?.modelId) return;
      console.log(`> Stopping model: ${data.modelId}`);
      ws.emit('stopModel', data);
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
  server.listen(PORT, (err: any) => {
    if (err) throw err;
    console.log(`> Server listening at http://${hostname}:${port} as ${process.env.NODE_ENV}`);
    console.log(`> WebSocket server running on ws://${hostname}:${port}/api/websocket`);
  });


server.on('error', (error: Error) => {
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
  server.close(() => {
    process.exit(0);
  });
});

}) 