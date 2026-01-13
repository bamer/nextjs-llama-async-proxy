import io from 'socket.io-client';

console.log('🧪 Testing Socket.IO connection to logging system...\n');

const socket = io('http://localhost:3000', {
  path: '/llamaproxws',
  transports: ['websocket']
});

let connected = false;
let logsReceived = 0;
let startTime = Date.now();

socket.on('connect', () => {
  connected = true;
  console.log('✅ Socket connected to server');
  console.log('   Socket ID:', socket.id);
  console.log('   Transport:', socket.io.engine.transport.name);

  // Wait a bit then send a test log
  setTimeout(() => {
    console.log('\n📤 Sending test log to server...');

    const testMessage = `TEST_SOCKET_LOG_${Date.now()}`;

    socket.emit('logs:add', {
      requestId: Date.now(),
      data: {
        level: 'info',
        message: `[CLIENT TEST] ${testMessage}`,
        source: 'client'
      }
    });

    console.log('   Message sent:', testMessage);
  }, 500);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
});

socket.on('logs:new', (data) => {
  logsReceived++;
  const latency = Date.now() - startTime;

  console.log(`\n📥 Received broadcast #${logsReceived}:`);
  console.log('   Data:', JSON.stringify(data, null, 2));
  console.log('   Latency:', `${latency}ms`);

  if (data.data && data.data.message) {
    console.log('   Message:', data.data.message);
  }
});

socket.on('logs:add:result', (data) => {
  console.log(`\n✅ Server response received:`);
  console.log('   Success:', data.success);
  console.log('   Request ID:', data.requestId);
  console.log('   Timestamp:', new Date(data.timestamp).toISOString());
});

socket.on('disconnect', (reason) => {
  connected = false;
  console.log('❌ Disconnected:', reason);
});

// Wait for results
setTimeout(() => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(60));
  console.log('Connected:', connected ? '✅ Yes' : '❌ No');
  console.log('Logs received:', logsReceived);
  console.log('Duration:', `${Date.now() - startTime}ms`);

  if (connected && logsReceived > 0) {
    console.log('\n🎉 SUCCESS! Logging system is working correctly.');
    console.log('\n📋 Test page: http://localhost:3000/test-logging.html');
    console.log('📋 Main app: http://localhost:3000/logs');
  } else {
    console.log('\n❌ FAILED! Check server logs for errors.');
  }

  console.log('='.repeat(60));

  process.exit(connected && logsReceived > 0 ? 0 : 1);
}, 5000);