/**
 * Socket.IO Router Status Test
 */

import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  path: "/llamaproxws",
  transports: ["websocket"],
  reconnection: false,
});

console.log("=== SOCKET.IO ROUTER STATUS TEST ===\n");

socket.on("connect", async () => {
  console.log("✅ Connected with ID:", socket.id);

  // Request llama status
  socket.emit("llama:status", { requestId: Date.now() }, (response) => {
    console.log("\n📊 llama:status response:");
    console.log(JSON.stringify(response, null, 2));
  });

  // Wait a bit for any broadcasts
  setTimeout(() => {
    socket.emit("llama:stop:result", { requestId: Date.now() }, (response) => {
      console.log("\n🛑 llama:stop:result response:");
      console.log(JSON.stringify(response, null, 2));
    });
  }, 1000);

  // Listen for status broadcasts
  socket.on("llama:status", (data) => {
    console.log("\n📡 Broadcast llama:status:");
    console.log(JSON.stringify(data, null, 2));
  });

  // Disconnect after tests
  setTimeout(() => {
    console.log("\n✅ Test complete");
    socket.disconnect();
    process.exit(0);
  }, 3000);
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection error:", err.message);
  process.exit(1);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});
