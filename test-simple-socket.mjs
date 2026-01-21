/**
 * Simple Router Test via Socket.IO
 */

import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  path: "/llamaproxws",
  transports: ["websocket"],
  reconnection: false,
});

console.log("=== SIMPLE ROUTER TEST ===\n");

socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);

  // Listen for status broadcasts
  socket.on("llama:status", (data) => {
    console.log(`📡 Broadcast: llama:status = ${JSON.stringify(data)?.substring(0, 100)}`);
  });

  // 1. Get status via callback
  socket.emit("llama:status", (response) => {
    console.log("\n1. Initial status:");
    console.log(`   ${JSON.stringify(response, null, 2).substring(0, 300)}`);
    
    const status = response?.data?.status || response;
    
    if (status.status === "running") {
      // Stop the router
      console.log("\n2. Stopping router...");
      socket.emit("llama:stop", (stopResult) => {
        console.log(`   Stop result: ${JSON.stringify(stopResult)}`);
        
        setTimeout(() => {
          socket.emit("llama:status", (statusAfterStop) => {
            console.log("\n3. Status after stop:");
            console.log(`   ${JSON.stringify(statusAfterStop, null, 2).substring(0, 300)}`);
            
            finish();
          });
        }, 3000);
      });
    } else {
      // Start the router
      console.log("\n2. Starting router...");
      socket.emit("llama:start", (startResult) => {
        console.log(`   Start result: ${JSON.stringify(startResult)?.substring(0, 300)}`);
        
        setTimeout(() => {
          socket.emit("llama:status", (statusAfterStart) => {
            console.log("\n3. Status after start:");
            console.log(`   ${JSON.stringify(statusAfterStart, null, 2).substring(0, 300)}`);
            
            finish();
          });
        }, 5000);
      });
    }
  });
});

function finish() {
  console.log("\n=== TEST COMPLETE ===");
  socket.disconnect();
  process.exit(0);
}

socket.on("connect_error", (err) => {
  console.error("❌ Connection error:", err.message);
  process.exit(1);
});
