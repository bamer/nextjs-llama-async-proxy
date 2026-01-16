/**
 * Detailed Router Button Debug Test
 */

import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";

async function debugRouterButton() {
  console.log("=== ROUTER BUTTON DEBUG ===\n");

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
    console.log("1. Loading Dashboard...");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(3000);

    // Get the full HTML of the router card
    const routerCardHtml = await page.evaluate(() => {
      const card = document.querySelector(".llama-router-status-card");
      return card ? card.innerHTML.substring(0, 1000) : "Not found";
    });
    console.log("\n2. Router card HTML (first 1000 chars):");
    console.log(routerCardHtml);

    // Check all buttons
    const allButtons = await page.$$("button");
    console.log(`\n3. Total buttons on page: ${allButtons.length}`);

    // Find buttons with data-action
    const actionButtons = await page.$$("[data-action]");
    console.log(`4. Buttons with [data-action]: ${actionButtons.length}`);

    for (const btn of actionButtons) {
      const action = await btn.getAttribute("data-action");
      const type = await btn.getAttribute("data-action-type");
      const text = await btn.textContent();
      console.log(`   - [data-action="${action}"] [data-action-type="${type}"]: "${text}"`);
    }

    // Check status indicator
    const statusText = await page.evaluate(() => {
      const badge = document.querySelector(".badge-text");
      return badge ? badge.textContent : "Not found";
    });
    console.log(`\n5. Status badge text: "${statusText}"`);

    // Check if state is set
    const stateStatus = await page.evaluate(() => {
      return window.stateManager?.get?.("llamaServerStatus") || "Not accessible";
    });
    console.log(`\n6. llamaServerStatus state:`, stateStatus);

    // Check socket connection
    const socketStatus = await page.evaluate(() => {
      return {
        connected: window.socketClient?.isConnected,
        id: window.socketClient?.id,
      };
    });
    console.log(`\n7. Socket status:`, socketStatus);

    // Check console errors
    const errors = consoleMessages.filter(
      (m) => m.type === "error" && !m.text.includes("Download the React DevTools")
    );
    if (errors.length > 0) {
      console.log("\n❌ Console errors:");
      errors.forEach((e) => console.log(`   - ${e.text.substring(0, 100)}`));
    } else {
      console.log("\n✅ No console errors");
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await browser.close();
  }
}

debugRouterButton().catch(console.error);
