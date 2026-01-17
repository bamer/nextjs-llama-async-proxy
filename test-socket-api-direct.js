/**
 * Test socket API directly
 */

import { io } from "socket.io-client";

async function testSocketAPI() {
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
      console.log("✅ Connected to socket, testing API...");

      try {
        // Test config:get
        console.log("\n📡 Testing config:get...");
        const configResponse = await new Promise((res, rej) => {
          const respTimeout = setTimeout(() => {
            rej(new Error("Config response timeout"));
          }, 5000);

          socket.once("config:get:result", (data) => {
            clearTimeout(respTimeout);
            res(data);
          });

          socket.emit("config:get", { requestId: Date.now() });
        });

        console.log("✅ config:get response received:", !!configResponse);
        console.log("📊 Config data:", configResponse);

        // Test metrics:history
        console.log("\n📡 Testing metrics:history...");
        const historyResponse = await new Promise((res, rej) => {
          const respTimeout = setTimeout(() => {
            rej(new Error("History response timeout"));
          }, 5000);

          socket.once("metrics:history:result", (data) => {
            clearTimeout(respTimeout);
            res(data);
          });

          socket.emit("metrics:history", { limit: 10, requestId: Date.now() });
        });

        console.log("✅ metrics:history response received:", !!historyResponse);
        console.log("📊 History count:", historyResponse?.history?.length || 0);

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

testSocketAPI()
  .then(() => {
    console.log("\n✅ Socket API test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Socket API test failed:", error);
    process.exit(1);
  });
