/**
 * Quick API test using curl-like approach
 */

import { fetch } from "node-fetch";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Connected to server");

  // Test 1: List presets
  console.log("\n[Test 1] Listing presets...");
  socket.emit("presets:list", {}, (response) => {
    if (response.success) {
      console.log("✓ Presets:");
      response.data.presets.forEach((p) => {
        console.log(`  - ${p.name}`);
      });
    } else {
      console.log("✗ Error:", response.error.message);
    }

    // Disconnect
    socket.disconnect();
    process.exit(0);
  });

  // Timeout in case server doesn't respond
  setTimeout(() => {
    console.log("✗ Timeout waiting for response");
    socket.disconnect();
    process.exit(1);
  }, 5000);
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
  process.exit(1);
});
