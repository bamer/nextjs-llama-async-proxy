/**
 * Test socket API directly
 */

import { io } from "socket.io-client";

async function testSocketAPI() {
  console.log("🔌 Connecting to socket...");
  const socket = io("http://localhost:3000", {
    path: "/llamaproxws",
    transports: ["polling"],
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
      console.log("✅ Connected to socket");

      try {
        // Test config:get
        console.log("\n📡 Testing config:get...");
        socket.emit("config:get", { requestId: Date.now() });

        // Wait for response with timeout
        const response = await new Promise((res, rej) => {
          const respTimeout = setTimeout(() => {
            rej(new Error("Response timeout"));
          }, 3000);

          socket.once("config:get:result", (data) => {
            clearTimeout(respTimeout);
            res(data);
          });
        });

        console.log("✅ config:get response received:", response);

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
