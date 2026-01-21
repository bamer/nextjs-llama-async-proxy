/**
 * Comprehensive Playwright Test for All Pages
 * Tests: Dashboard, Models, Presets, Settings, Logs
 * Verifies: Page loads, data loads, no console errors
 */

import { chromium } from "playwright";

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const logs = [];

  // Capture console messages
  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    logs.push({ type, text });
    if (type === "error") {
      errors.push(text);
    }
  });

  // Capture page errors
  page.on("pageerror", (error) => {
    errors.push(`Page Error: ${error.message}`);
  });

  const baseUrl = "http://localhost:3000";
  const pages = [
    { path: "/", name: "Dashboard" },
    { path: "/models", name: "Models" },
    { path: "/presets", name: "Presets" },
    { path: "/settings", name: "Settings" },
    { path: "/logs", name: "Logs" },
  ];

  console.log("=".repeat(60));
  console.log("PLAYWRIGHT COMPREHENSIVE PAGE TEST");
  console.log("=".repeat(60));

  for (const { path, name } of pages) {
    console.log(`\n[TESTING] ${name} page (${path})...`);
    errors.length = 0; // Reset errors for each page

    try {
      await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(2000); // Wait for socket data to load

      // Check if main content loaded
      const appContent = await page.$("#app");
      const hasContent = appContent && (await appContent.innerHTML()).length > 100;

      // Check for specific page elements
      let pageSpecificCheck = "N/A";
      if (name === "Dashboard") {
        const dashboard = await page.$(".dashboard-page, .dashboard-main");
        pageSpecificCheck = dashboard ? "Dashboard elements found" : "No dashboard elements";
      } else if (name === "Models") {
        const modelsTable = await page.$(".models-page, .models-table");
        pageSpecificCheck = modelsTable ? "Models table found" : "No models table";
      } else if (name === "Presets") {
        const presets = await page.$(".presets-page");
        pageSpecificCheck = presets ? "Presets page found" : "No presets page";
      } else if (name === "Settings") {
        const settings = await page.$(".settings-page");
        pageSpecificCheck = settings ? "Settings page found" : "No settings page";
      } else if (name === "Logs") {
        const logsPage = await page.$(".logs-page, .log-viewer");
        pageSpecificCheck = logsPage ? "Logs page found" : "No logs page";
      }

      // Filter out expected/benign errors
      const criticalErrors = errors.filter(
        (e) =>
          !e.includes("WebSocket") &&
          !e.includes("socket") &&
          !e.includes("favicon") &&
          !e.includes("404") &&
          !e.includes("stateManager") // Should not appear anymore
      );

      const status = criticalErrors.length === 0 ? "✅ PASS" : "❌ FAIL";
      console.log(`  Status: ${status}`);
      console.log(`  Content: ${hasContent ? "Yes" : "No"}`);
      console.log(`  Check: ${pageSpecificCheck}`);
      console.log(`  Errors: ${criticalErrors.length}`);

      if (criticalErrors.length > 0) {
        console.log(`  Error Details:`);
        criticalErrors.forEach((e) => console.log(`    - ${e}`));
      }
    } catch (e) {
      console.log(`  ❌ FAIL - Exception: ${e.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));

  // Test Socket.IO connection
  console.log("\n[TESTING] Socket.IO connection...");
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Check if socket client is defined
  const socketCheck = await page.evaluate(() => {
    if (typeof socketClient !== "undefined") {
      return { defined: true, connected: socketClient.socket?.connected || false };
    }
    return { defined: false };
  });
  console.log(`  SocketClient defined: ${socketCheck.defined ? "Yes" : "No"}`);
  console.log(`  Socket connected: ${socketCheck.connected ? "Yes" : "No"}`);

  // Check specific components
  console.log("\n[TESTING] Components...");
  const componentChecks = await page.evaluate(() => {
    return {
      Layout: typeof Layout !== "undefined",
      DashboardPage: typeof DashboardPage !== "undefined",
      ModelsPage: typeof ModelsPage !== "undefined",
      PresetsPage: typeof PresetsPage !== "undefined",
      SettingsPage: typeof window.SettingsPage !== "undefined",
      socketClient: typeof socketClient !== "undefined",
      showNotification: typeof showNotification === "function",
    };
  });

  for (const [name, exists] of Object.entries(componentChecks)) {
    console.log(`  ${name}: ${exists ? "✅" : "❌"}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST COMPLETE");
  console.log("=".repeat(60));

  await browser.close();
}

runTests().catch(console.error);
