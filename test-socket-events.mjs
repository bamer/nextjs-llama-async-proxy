/**
 * Test Socket.IO events for router start
 */

import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  path: "/llamaproxws",
  transports: ["websocket"],
  reconnection: false,
});

console.log("=== SOCKET.IO EVENT TEST ===\n");

socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);
  
  // Listen for all events
  socket.onAny((event, data) => {
    if (event.includes("llama") || event.includes("status")) {
      console.log(`📡 Event: ${event}`);
      console.log(`   Data: ${JSON.stringify(data)?.substring(0, 200)}`);
    }
  });

  // Request current status
  console.log("\n📊 Requesting llama:status...");
  socket.emit("llama:status", { requestId: Date.now() }, (response) => {
    console.log("Response:", JSON.stringify(response, null, 2).substring(0, 500));
  });

  // Wait then start the router
  setTimeout(() => {
    console.log("\n🚀 Starting router...");
    socket.emit("llama:start", { requestId: Date.now() }, (response) => {
      console.log("Start response:", JSON.stringify(response, null, 2).substring(0, 500));
    });
  }, 2000);

  // Disconnect after tests
  setTimeout(() => {
    console.log("\n✅ Test complete");
    socket.disconnect();
    process.exit(0);
  }, 15000);
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection error:", err.message);
  process.exit(1);
});
