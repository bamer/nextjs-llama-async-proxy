/**
 * Test concurrent requests to find the timeout issue
 */

import { io } from "socket.io-client";

async function testConcurrentRequests() {
  console.log("🔌 Connecting to socket...");
  const socket = io("http://localhost:3000", {
    path: "/llamaproxws",
    transports: ["websocket"],
    reconnection: false,
    timeout: 5000,
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.disconnect();
      console.error("❌ Connection timeout after 5s");
      reject(new Error("Connection timeout"));
    }, 5000);

    socket.on("connect", async () => {
      console.log("✅ Connected, testing concurrent requests...");

      try {
        // Test concurrent requests like the dashboard does
        console.log(
          "\n🚀 Starting 6 concurrent requests (config, models, metrics, history, settings, presets)..."
        );

        const results = await Promise.allSettled([
          testRequest(socket, "config:get", "config:get:result"),
          testRequest(socket, "models:list", "models:list:result"),
          testRequest(socket, "metrics:get", "metrics:get:result"),
          testRequest(socket, "metrics:history", "metrics:history:result"),
          testRequest(socket, "settings:get", "settings:get:result"),
          testRequest(socket, "presets:list", "presets:list:result"),
        ]);

        console.log("\n📊 Results:");
        results.forEach((result, i) => {
          const names = [
            "config",
            "models",
            "metrics",
            "history",
            "settings",
            "presets",
          ];
          if (result.status === "fulfilled") {
            console.log(`✅ ${names[i]}: SUCCESS`);
          } else {
            console.log(`❌ ${names[i]}: FAILED - ${result.reason.message}`);
          }
        });

        socket.disconnect();
        clearTimeout(timeout);
        resolve(true);
      } catch (error) {
        console.error("❌ Error during concurrent test:", error.message);
        socket.disconnect();
        clearTimeout(timeout);
        reject(error);
      }
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error.message);
      clearTimeout(timeout);
      reject(error);
    });
  });
}

function testRequest(socket, event, responseEvent) {
  return new Promise((resolve, reject) => {
    const respTimeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${responseEvent}`));
    }, 5000);

    socket.once(responseEvent, (data) => {
      clearTimeout(respTimeout);
      resolve(data);
    });

    socket.emit(event, { requestId: Date.now() });
  });
}

testConcurrentRequests()
  .then(() => {
    console.log("\n✅ Concurrent test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Concurrent test failed:", error);
    process.exit(1);
  });
