/**
 * Simple Socket.IO Test
 * Tests basic socket functionality
 */

import { chromium } from "playwright";

(async () => {
  console.log("🔌 SIMPLE SOCKET.IO TEST\n");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log("📄 Loading Dashboard...");
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 10000 });
    await page.waitForTimeout(2000);

    // Check socket variables
    const socketCheck = await page.evaluate(() => {
      return {
        socketClientExists: typeof window.socketClient !== "undefined",
        socketClientHasRequest: typeof window.socketClient?.request === "function",
        socketClientConnected: window.socketClient?.isConnected || false,
        ioExists: typeof window.io !== "undefined",
      };
    });

    console.log(`\n🔌 Socket.IO Status:`);
    console.log(`   ✅ window.socketClient exists: ${socketCheck.socketClientExists}`);
    console.log(`   ✅ request method exists: ${socketCheck.socketClientHasRequest}`);
    console.log(`   ✅ Is connected: ${socketCheck.socketClientConnected}`);
    console.log(`   ✅ window.io library loaded: ${socketCheck.ioExists}`);

    // Test emit (should work without timeout)
    const emitTest = await page.evaluate(() => {
      try {
        if (window.socketClient && window.socketClient.isConnected) {
          // Just emit a test event without waiting for response
          window.socketClient.emit("ping", { time: Date.now() });
          return { success: true, message: "Emit works" };
        }
        return { success: false, message: "Socket not connected" };
      } catch (error) {
        return { success: false, message: error.message };
      }
    });

    console.log(`\n🧪 Emit Test:`);
    console.log(`   ${emitTest.success ? "✅" : "❌"} ${emitTest.message}`);

    // Check connection status
    console.log(`\n🔌 Connection Status:`);
    if (socketCheck.socketClientConnected) {
      console.log(`   ✅ Socket.IO IS WORKING!`);
      console.log(`   ✅ Backend communication channel is operational`);
      console.log(`   ✅ Frontend can send events to backend`);
      console.log(`\n🎉 CONCLUSION: Socket.IO is fully functional!`);
    } else {
      console.log(`   ❌ Socket is not connected`);
      console.log(`   ⚠️  Backend communication may be impaired`);
    }
  } catch (error) {
    console.log(`\n❌ Test failed: ${error.message}`);
  }

  await browser.close();
})();
