const io = require('socket.io-client');

console.log('Connecting to WebSocket server...');
const socket = io('http://localhost:3000', {
  path: '/llamaproxws',
  transports: ['websocket']
});

// Listen to ALL events
const onevent = socket.onevent;
socket.onevent = function (packet) {
  console.log('📨 Raw event received:', packet.data[0]);
  onevent.call(this, packet);
};

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

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  process.exit(1);
});

// Listen for all specific events
const events = ['message', 'models_loaded', 'models', 'metrics', 'logs', 'connection', 'status', 'llamaStatus'];
events.forEach(event => {
  socket.on(event, (data) => {
    console.log(`📥 Received '${event}' event:`, data?.success, data?.type);
  });
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('Timeout - no response');
  socket.disconnect();
  process.exit(1);
}, 10000);
