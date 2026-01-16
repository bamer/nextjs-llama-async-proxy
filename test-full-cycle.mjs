/**
 * Full Router Start/Stop Cycle Test via Socket.IO
 */

import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  path: "/llamaproxws",
  transports: ["websocket"],
  reconnection: false,
});

console.log("=== FULL ROUTER START/STOP TEST ===\n");

let events = [];

socket.on("connect", async () => {
  console.log("✅ Connected:", socket.id);
  
  // Listen for all events
  socket.onAny((event, data) => {
    events.push({ event, data, time: Date.now() - startTime });
    if (event.includes("llama") || event.includes("status")) {
      console.log(`📡 [${((Date.now() - startTime)/1000).toFixed(1)}s] Event: ${event}`);
    }
  });

  const startTime = Date.now();

  try {
    // 1. Check initial status
    console.log("\n1. Checking initial status...");
    const initial = await request("llama:status");
    console.log(`   Status: ${initial?.status?.status}`);
    console.log(`   Process: ${initial?.processRunning}`);
    
    // 2. Stop if running
    if (initial?.status === "running" || initial?.processRunning) {
      console.log("\n2. Stopping router...");
      const stopResult = await request("llama:stop");
      console.log(`   Stop result: ${JSON.stringify(stopResult)}`);
      
      // Wait for stop
      await wait(2000);
      
      const afterStop = await request("llama:status");
      console.log(`   Status after stop: ${afterStop?.status?.status}`);
      console.log(`   Process after stop: ${afterStop?.processRunning}`);
    }
    
    // 3. Start router
    console.log("\n3. Starting router...");
    const startResult = await request("llama:start");
    console.log(`   Start result: ${JSON.stringify(startResult)?.substring(0, 200)}`);
    
    // 4. Wait and poll for running status
    console.log("\n4. Waiting for router to start...");
    let started = false;
    for (let i = 0; i < 30; i++) {
      await wait(1000);
      const status = await request("llama:status");
      console.log(`   [${i+1}s] Status: ${status?.status?.status}, Process: ${status?.processRunning}`);
      
      if (status?.status === "running" && status?.processRunning) {
        started = true;
        console.log(`   ✅ Router started after ${i+1} seconds`);
        break;
      }
    }
    
    if (!started) {
      console.log("   ⚠️ Router did not start within 30 seconds");
    }
    
    // 5. Stop router
    console.log("\n5. Stopping router...");
    const stopResult2 = await request("llama:stop");
    console.log(`   Stop result: ${JSON.stringify(stopResult2)?.substring(0, 200)}`);
    
    // 6. Wait and poll for stopped status
    console.log("\n6. Waiting for router to stop...");
    let stopped = false;
    for (let i = 0; i < 15; i++) {
      await wait(1000);
      const status = await request("llama:status");
      console.log(`   [${i+1}s] Status: ${status?.status?.status}, Process: ${status?.processRunning}`);
      
      if (status?.status === "idle" && !status?.processRunning) {
        stopped = true;
        console.log(`   ✅ Router stopped after ${i+1} seconds`);
        break;
      }
    }
    
    if (!stopped) {
      console.log("   ⚠️ Router did not stop within 15 seconds");
    }
    
    // Summary
    console.log("\n=== TEST SUMMARY ===");
    console.log(`Start: ${started ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Stop: ${stopped ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Events received: ${events.length}`);
    
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    socket.disconnect();
    process.exit(0);
  }
});

function request(event, data = {}) {
  return new Promise((resolve, reject) => {
    const requestId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const responseEvent = `${event}:response:${requestId}`;
    
    const timeout = setTimeout(() => {
      socket.off(responseEvent);
      reject(new Error(`Request timeout: ${event}`));
    }, 30000);
    
    socket.once(responseEvent, (response) => {
      clearTimeout(timeout);
      socket.off(responseEvent);
      resolve(response?.data || response);
    });
    
    socket.emit(event, { ...data, requestId });
  });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

socket.on("connect_error", (err) => {
  console.error("❌ Connection error:", err.message);
  process.exit(1);
});
