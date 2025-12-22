/**
 * Server Integration
 * 
 * This module handles the server setup and integration for the Next.js application.
 * It initializes the WebSocket server when the application starts.
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';


const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Initialize Next.js app
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Start WebSocket server
  const wsServer = new WebSocketServer({ server });

  // Start HTTP server
  server.listen(port, () => {
    console.log(`> Server listening at http://${hostname}:${port} as ${dev ? 'development' : process.env.NODE_ENV}`);
    console.log(`> WebSocket server running on ws://${hostname}:${port}/api/websocket`);
  });

  // Handle server errors
  server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
  });

  // Handle process termination
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    
    // Stop WebSocket server
    wsServer.on( 'close ', error) => {
      console.error('Server error:', error);
      wsServer.close();
    });
    
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

export {}; // Ensure this is treated as a module