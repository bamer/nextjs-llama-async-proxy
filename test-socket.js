/**
 * Force Refresh Test - Clears cache and tests
 */

import { chromium } from "playwright";

async function runTest() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];

  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error" && text.includes("SocketClient")) {
      errors.push(text);
    }
  });

  page.on("pageerror", (error) => {
    errors.push(`Page Error: ${error.message}`);
  });

  console.log("Opening dashboard with hard reload...");

  // Navigate with cache disabled
  await page.goto("http://localhost:3000", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  // Wait for socket connection
  await page.waitForTimeout(5000);

  // Check socket connection
  const socketStatus = await page.evaluate(() => {
    if (typeof socketClient !== "undefined") {
      return {
        defined: true,
        connected: socketClient.isConnected,
        socketId: socketClient.socket?.id,
        path: socketClient.options?.path,
      };
    }
    return { defined: false };
  });

  console.log("\nSocket Status:");
  console.log("  Defined:", socketStatus.defined);
  console.log("  Connected:", socketStatus.connected);
  console.log("  Socket ID:", socketStatus.socketId);
  console.log("  Path:", socketStatus.path);

  console.log("\nErrors found:");
  if (errors.length === 0) {
    console.log("  None!");
  } else {
    errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  }

  await browser.close();
}

runTest().catch(console.error);
