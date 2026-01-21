/**
 * Router Test via Socket.IO - Listening for Response Events
 */

import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  path: "/llamaproxws",
  transports: ["websocket"],
  reconnection: false,
});

console.log("=== ROUTER TEST VIA SOCKET.IO ===\n");

let requestId = Date.now();

socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);

  // Listen for response events
  socket.on("llama:status:result", (response) => {
    console.log("\n📊 llama:status:result received:");
    console.log(`   ${JSON.stringify(response, null, 2).substring(0, 400)}`);
    
    const status = response?.data?.status || response;
    
    if (status.status === "running") {
      testStop(status);
    } else {
      testStart(status);
    }
  });

  // Listen for status broadcasts
  socket.on("llama:status", (data) => {
    console.log(`\n📡 Broadcast llama:status: ${JSON.stringify(data)?.substring(0, 100)}`);
  });

  // Request status
  console.log("📊 Requesting status...");
  requestId = Date.now();
  socket.emit("llama:status", { requestId });
});

async function testStart(status) {
  console.log("\n🚀 Testing START (current status: " + status.status + ")...");
  
  socket.once("llama:start:result", (response) => {
    console.log(`   Start result: ${JSON.stringify(response)?.substring(0, 200)}`);
    
    // Wait for broadcast
    setTimeout(() => {
      requestStatus("After start");
    }, 3000);
  });
  
  socket.emit("llama:start", { requestId: Date.now() });
}

async function testStop(status) {
  console.log("\n🛑 Testing STOP (current status: " + status.status + ")...");
  
  socket.once("llama:stop:result", (response) => {
    console.log(`   Stop result: ${JSON.stringify(response)?.substring(0, 200)}`);
    
    // Wait for broadcast
    setTimeout(() => {
      requestStatus("After stop");
    }, 3000);
  });
  
  socket.emit("llama:stop", { requestId: Date.now() });
}

function requestStatus(label) {
  console.log(`\n📊 ${label} - Requesting status...`);
  socket.emit("llama:status", { requestId: Date.now() });
}

setTimeout(() => {
  console.log("\n=== TEST TIMEOUT ===");
  socket.disconnect();
  process.exit(0);
}, 60000);

socket.on("connect_error", (err) => {
  console.error("❌ Connection error:", err.message);
  process.exit(1);
});
