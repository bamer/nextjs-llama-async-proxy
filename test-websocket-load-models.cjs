const { io: ioclient } = require("socket.io-client");

console.log('Testing WebSocket load_models...');

const socket = ioclient('http://localhost:3000', {
  path: '/llamaproxws',
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');

  // Request models from database
  socket.emit('load_models');
});

socket.on('models_loaded', (data) => {
  console.log('\n📚 Models loaded response:');
  console.log('Success:', data.success);
  console.log('Model count:', data.data?.length || 0);

  if (data.data && data.data.length > 0) {
    console.log('\nModel list:');
    data.data.forEach((model, index) => {
      console.log(`  ${index + 1}. ${model.name} (ID: ${model.id}, Type: ${model.type})`);
    });
  }

  socket.disconnect();
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

socket.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
  socket.disconnect();
});

socket.on('disconnect', () => {
  console.log('\n🔌 Disconnected from WebSocket server');
  process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('❌ Timeout: No response from server');
  socket.disconnect();
  process.exit(1);
}, 10000);
