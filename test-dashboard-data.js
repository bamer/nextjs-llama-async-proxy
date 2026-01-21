/**
 * Test script to verify dashboard data loading
 */

import { io } from "socket.io-client";

async function testDashboardData() {
  console.log("🔌 Connecting to socket...");
  const socket = io("http://localhost:3000", {
    transports: ["polling"], // Use polling instead of websocket for testing
    reconnection: false,
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error("Connection timeout"));
    }, 5000);

    socket.on("connect", async () => {
      console.log("✅ Connected to socket");

      try {
        // Test 1: Get config
        console.log("\n📋 Test 1: Getting config...");
        const config = await socket.emitWithAck("config:get", {});
        console.log("✅ Config loaded:", !!config);

        // Test 2: Get models
        console.log("\n📋 Test 2: Getting models...");
        const models = await socket.emitWithAck("models:list", {});
        console.log("✅ Models loaded:", models?.models?.length || 0, "models");

        // Test 3: Get metrics
        console.log("\n📋 Test 3: Getting metrics...");
        const metrics = await socket.emitWithAck("metrics:get", {});
        console.log("✅ Metrics loaded:", !!metrics?.metrics);

        // Test 4: Get metrics history (the critical one!)
        console.log("\n📋 Test 4: Getting metrics history...");
        const history = await socket.emitWithAck("metrics:history", { limit: 60 });
        console.log("✅ History loaded:", history?.history?.length || 0, "records");

        if (history?.history?.length > 0) {
          console.log("📊 Sample history record:", JSON.stringify(history.history[0], null, 2));
        }

        // Test 5: Get settings
        console.log("\n📋 Test 5: Getting settings...");
        const settings = await socket.emitWithAck("settings:get", {});
        console.log("✅ Settings loaded:", !!settings);

        // Test 6: Get presets
        console.log("\n📋 Test 6: Getting presets...");
        const presets = await socket.emitWithAck("presets:list", {});
        console.log("✅ Presets loaded:", presets?.presets?.length || 0, "presets");

        console.log("\n🎉 All tests passed! Dashboard data loading should work.");

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

testDashboardData()
  .then(() => {
    console.log("\n✅ Dashboard data loading test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Dashboard data loading test failed:", error);
    process.exit(1);
  });
