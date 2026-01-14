/**
 * Critical Socket.IO Test
 * Verifies that the main communication channel is working
 */

import { chromium } from "playwright";

(async () => {
  console.log("🔌 CRITICAL SOCKET.IO VERIFICATION TEST\n");
  console.log("=".repeat(80));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Track socket events
  const socketEvents = [];
  let socketConnected = false;
  let socketClientFound = false;
  let socketFound = false;

  // Monitor network requests for Socket.IO
  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("socket.io")) {
      socketEvents.push({ url, status: response.status(), time: Date.now() });
    }
  });

  try {
    console.log("📄 Loading Dashboard...");
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 10000 });
    await page.waitForTimeout(2000);

    // Check for socket variables
    socketClientFound = await page.evaluate(() => {
      return typeof window.socketClient !== "undefined";
    });

    socketFound = await page.evaluate(() => {
      return typeof window.socket !== "undefined";
    });

    const ioFound = await page.evaluate(() => {
      return typeof window.io !== "undefined";
    });

    console.log(`\n🔌 Socket.IO Variable Check:`);
    console.log(`   ❌ window.socketClient: ${socketClientFound ? "✅ FOUND" : "❌ NOT FOUND"}`);
    console.log(`   ❌ window.socket: ${socketFound ? "✅ FOUND" : "❌ NOT FOUND"}`);
    console.log(`   ❌ window.io (Socket.IO lib): ${ioFound ? "✅ FOUND" : "❌ NOT FOUND"}`);

    // Check if socket is connected
    socketConnected = await page.evaluate(() => {
      if (window.socketClient) {
        return window.socketClient.socket?.connected || false;
      }
      if (window.socket) {
        return window.socket.connected || false;
      }
      return false;
    });

    console.log(`\n🔌 Connection Status:`);
    console.log(`   ${socketConnected ? "✅ CONNECTED" : "❌ NOT CONNECTED"}`);

    // Test actual communication by requesting data
    console.log(`\n🧪 Testing Backend Communication:`);

    const dataTest = await page.evaluate(async () => {
      try {
        if (window.socketClient) {
          // Request models list
          const models = await window.socketClient.request("models:list", {});
          return {
            success: true,
            method: "socketClient.request",
            hasModels: Array.isArray(models?.models),
            modelsCount: models?.models?.length || 0,
          };
        }
        return { success: false, error: "No socket client found" };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    if (dataTest.success) {
      console.log(`   ✅ Backend Communication: WORKING`);
      console.log(`   📊 Models received: ${dataTest.modelsCount}`);
    } else {
      console.log(`   ❌ Backend Communication: FAILED - ${dataTest.error}`);
    }

    // Check Socket.IO network requests
    console.log(`\n📡 Socket.IO Network Requests:`);
    console.log(
      `   ${socketEvents.length > 0 ? "✅ Socket.IO requests detected" : "❌ No Socket.IO requests found"}`
    );

    socketEvents.forEach((event) => {
      console.log(`   - ${event.url} (Status: ${event.status})`);
    });

    // Overall status
    console.log("\n" + "=".repeat(80));
    console.log("🔌 SOCKET.IO VERIFICATION SUMMARY");
    console.log("=".repeat(80));

    const allGood =
      socketClientFound && (socketFound || ioFound) && socketConnected && dataTest.success;

    console.log(
      `\n${allGood ? "✅" : "❌"} CRITICAL RESULT: ${allGood ? "SOCKET.IO IS FULLY OPERATIONAL" : "SOCKET.IO HAS ISSUES"}`
    );

    if (!allGood) {
      console.log("\n❌ Issues Found:");
      if (!socketClientFound) console.log("   - window.socketClient not found (CRITICAL)");
      if (!socketFound && !ioFound) console.log("   - No Socket.IO library loaded (CRITICAL)");
      if (!socketConnected) console.log("   - Socket not connected (CRITICAL)");
      if (!dataTest.success) console.log("   - Cannot communicate with backend (CRITICAL)");
    } else {
      console.log("\n✅ All Socket.IO checks passed!");
      console.log("   - Client library loaded");
      console.log("   - Connected to server");
      console.log("   - Can send/receive data");
      console.log("   - Backend communication working");
    }
  } catch (error) {
    console.log(`\n❌ Test failed: ${error.message}`);
  }

  await browser.close();
})();
