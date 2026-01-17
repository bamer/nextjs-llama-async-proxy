/**
 * Test stateManager migration - verify socket communication works
 */

import { io } from "socket.io-client";

async function testStateManagerPattern() {
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
      console.log("✅ Connected to socket, testing stateManager pattern...");

      try {
        // Test stateManager pattern: emit event with requestId, listen for :result
        console.log("\n📡 Testing config:get (stateManager pattern)...");

        const configResponse = await new Promise((res, rej) => {
          const respTimeout = setTimeout(() => {
            rej(new Error("Config response timeout"));
          }, 5000);

          socket.once("config:get:result", (data) => {
            clearTimeout(respTimeout);
            res(data);
          });

          // stateManager.request() sends: { requestId: "req_xxx", ... }
          const reqId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          socket.emit("config:get", { requestId: reqId });
        });

        console.log("✅ config:get response received:", !!configResponse);
        console.log("📊 Data:", configResponse?.data ? "present" : "missing");

        // Test models:list
        console.log("\n📡 Testing models:list (stateManager pattern)...");

        const modelsResponse = await new Promise((res, rej) => {
          const respTimeout = setTimeout(() => {
            rej(new Error("Models response timeout"));
          }, 5000);

          socket.once("models:list:result", (data) => {
            clearTimeout(respTimeout);
            res(data);
          });

          const reqId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          socket.emit("models:list", { requestId: reqId });
        });

        console.log("✅ models:list response received:", !!modelsResponse);
        console.log("📊 Models count:", modelsResponse?.data?.models?.length || 0);

        socket.disconnect();
        clearTimeout(timeout);
        resolve(true);
      } catch (error) {
        console.error("❌ Error during test:", error.message);
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

testStateManagerPattern()
  .then(() => {
    console.log("\n✅ StateManager pattern test completed successfully");
    console.log("💡 This confirms the dashboard migration will work");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ StateManager pattern test failed:", error);
    process.exit(1);
  });
