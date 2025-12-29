const io = require('socket.io-client');

console.log('Connecting to WebSocket server...');
const socket = io('http://localhost:3000', {
  path: '/llamaproxws',
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('✅ Connected to server');
  console.log('Socket ID:', socket.id);

  // Wait a moment then request models from database
  setTimeout(() => {
    console.log('Sending load_models message...');
    socket.emit('load_models', {});
  }, 1000);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
  process.exit(0);
});

socket.on('message', (message) => {
  console.log('Received message:', message.type);

  if (message.type === 'models_loaded') {
    console.log('Models loaded from database!');
    console.log('Success:', message.success);
    console.log('Number of models:', message.data ? message.data.length : 0);
    if (message.data && message.data.length > 0) {
      console.log('First model:', message.data[0]);
      console.log('First model ID type:', typeof message.data[0].id);
    }
    setTimeout(() => {
      socket.disconnect();
    }, 1000);
  }

  if (message.type === 'connection') {
    console.log('Connection confirmed with client ID:', message.clientId);
  }
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('Timeout - no response');
  socket.disconnect();
  process.exit(1);
}, 10000);
