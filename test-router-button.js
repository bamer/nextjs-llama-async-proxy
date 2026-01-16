/**
 * Quick Router Button Test
 * Tests the router start/stop functionality
 */

import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";

async function testRouterButton() {
  console.log("=== ROUTER BUTTON TEST ===\n");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  const consoleMessages = [];
  page.on("console", (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  try {
    console.log("1. Navigating to Dashboard...");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);

    // Find the router toggle button
    const toggleBtn = await page.$('[data-action="toggle"]');

    if (!toggleBtn) {
      console.log("❌ Toggle button not found!");
      return;
    }

    const btnText = await toggleBtn.textContent();
    console.log(`2. Found toggle button: "${btnText}"`);

    // Check status indicator
    const statusIndicator = await page.$(".status-indicator");
    const statusClass = await statusIndicator?.getAttribute("class");
    console.log(`3. Status indicator class: ${statusClass}`);

    // Click the button
    console.log("4. Clicking toggle button...");
    await toggleBtn.click();
    await page.waitForTimeout(500);

    const newBtnText = await toggleBtn.textContent();
    console.log(`5. Button text after click: "${newBtnText}"`);

    // Check console for errors
    const errors = consoleMessages.filter((m) => m.type === "error");
    if (errors.length > 0) {
      console.log("\n❌ Console errors found:");
      errors.forEach((e) => console.log(`   - ${e.text}`));
    } else {
      console.log("\n✅ No console errors");
    }

    // Check socket connection
    const socketConnected = await page.evaluate(() => {
      return window.socketClient?.isConnected || false;
    });
    console.log(`\n✅ Socket connected: ${socketConnected}`);

    console.log("\n=== TEST COMPLETE ===");
  } catch (error) {
    console.error("Test error:", error.message);
  } finally {
    await browser.close();
  }
}

testRouterButton().catch(console.error);
