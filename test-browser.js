/**
 * Browser Integration Test Script
 * Tests the application in a real browser environment
 */

import { chromium } from "playwright";

async function runTests() {
  console.log("Starting browser tests...\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const logs = [];

  // Capture console messages
  page.on("console", (msg) => {
    const text = msg.text();
    logs.push({ type: msg.type(), text });
    if (msg.type() === "error") {
      errors.push(text);
    }
  });

  // Capture page errors
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  try {
    // Navigate to the app
    console.log("1. Loading application...");
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 30000 });

    // Wait for app to initialize and Socket.IO to connect
    console.log("   Waiting for app initialization...");
    await page.waitForFunction(
      () => {
        return window.router && window.stateManager && document.querySelector(".dashboard-page");
      },
      { timeout: 10000 }
    );

    // Wait a bit more for Socket.IO connection
    await page.waitForTimeout(2000);
    console.log("   ✓ App initialized\n");

    // Check if main elements exist
    console.log("2. Checking main elements...");

    const app = await page.$("#app");
    console.log(`   ${app ? "✓" : "✗"} #app element exists`);

    const sidebar = await page.$(".sidebar");
    console.log(`   ${sidebar ? "✓" : "✗"} Sidebar exists`);

    const header = await page.$(".page-header");
    console.log(`   ${header ? "✓" : "✗"} Header exists`);

    const pageContent = await page.$("#page-content");
    console.log(`   ${pageContent ? "✓" : "✗"} #page-content exists\n`);

    // Check for dashboard content
    console.log("3. Checking dashboard content...");
    const dashboard = await page.$(".dashboard-page");
    console.log(`   ${dashboard ? "✓" : "✗"} Dashboard page rendered`);

    const serverStatus = await page.$(".server-status-card");
    console.log(`   ${serverStatus ? "✓" : "✗"} Server status card exists`);

    const metricsGrid = await page.$(".metrics-grid");
    console.log(`   ${metricsGrid ? "✓" : "✗"} Metrics grid exists\n`);

    // Test navigation
    console.log("4. Testing navigation...");

    // Click on Models link
    await page.click('a[data-page="models"]');
    await page.waitForTimeout(1000);
    const modelsPage = await page.$(".models-page");
    console.log(`   ${modelsPage ? "✓" : "✗"} Navigated to Models page`);

    // Click on Monitoring link
    await page.click('a[data-page="monitoring"]');
    await page.waitForTimeout(1000);
    const monitoringPage = await page.$(".monitoring-page");
    console.log(`   ${monitoringPage ? "✓" : "✗"} Navigated to Monitoring page`);

    // Click on Logs link
    await page.click('a[data-page="logs"]');
    await page.waitForTimeout(1000);
    const logsPage = await page.$(".logs-page");
    console.log(`   ${logsPage ? "✓" : "✗"} Navigated to Logs page`);

    // Click on Settings link
    await page.click('a[data-page="settings"]');
    await page.waitForTimeout(1000);
    const settingsPage = await page.$(".settings-page");
    console.log(`   ${settingsPage ? "✓" : "✗"} Navigated to Settings page`);

    // Go back to dashboard
    await page.click('a[data-page="dashboard"]');
    await page.waitForTimeout(1000);
    const dashboardAfterNav = await page.$(".dashboard-page");
    console.log(`   ${dashboardAfterNav ? "✓" : "✗"} Navigated back to Dashboard\n`);

    // Summary
    console.log("=".repeat(50));
    console.log("TEST SUMMARY");
    console.log("=".repeat(50));
    console.log(`Total console messages: ${logs.length}`);
    console.log(`Errors found: ${errors.length}`);

    if (errors.length > 0) {
      console.log("\nErrors:");
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    console.log("\n" + (errors.length === 0 ? "✓ ALL TESTS PASSED" : "✗ SOME TESTS FAILED"));
  } catch (error) {
    console.error("Test error:", error.message);
    errors.push(error.message);
  } finally {
    await browser.close();
  }

  return errors.length === 0;
}

runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
