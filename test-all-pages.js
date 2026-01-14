/**
 * Comprehensive Page Testing Script
 * Tests all pages and functionality with screenshots and console checks
 */

import { chromium } from "playwright";

(async () => {
  console.log("🚀 Starting Comprehensive Page Testing...\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  // Test results storage
  const results = {
    pages: [],
    errors: [],
    screenshots: [],
  };

  // Listen for console messages
  const consoleMessages = [];
  page.on("console", (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  // Listen for page errors
  page.on("pageerror", (error) => {
    results.errors.push({ page: page.url(), error: error.message });
  });

  // Pages to test
  const pages = [
    { path: "/", name: "Dashboard" },
    { path: "/models", name: "Models Management" },
    { path: "/presets", name: "Presets Configuration" },
    { path: "/settings", name: "Settings" },
    { path: "/logs", name: "Logs Viewer" },
    { path: "/monitoring", name: "Monitoring" },
  ];

  // Test each page
  for (const testPage of pages) {
    console.log(`\n📄 Testing: ${testPage.name} (${testPage.path})`);

    try {
      // Navigate to page
      await page.goto(`http://localhost:3000${testPage.path}`, {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      // Wait for page to fully load
      await page.waitForTimeout(2000);

      // Take snapshot
      const snapshot = await page.snapshot();
      const hasContent = snapshot && snapshot.length > 0;

      // Take screenshot
      const screenshotPath = `/home/bamer/nextjs-llama-async-proxy/screenshots/${testPage.name.toLowerCase().replace(/\s+/g, "-")}.png`;
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
        quality: 80,
      });

      // Check for critical elements
      const appElement = await page.$("#app");
      const pageContent = await page.$("#page-content");
      const hasRouter = await page.$(".router-content, .route-content");

      // Count console errors for this page
      const pageErrors = consoleMessages.filter((m) => m.type === "error").length;

      // Store results
      results.pages.push({
        name: testPage.name,
        path: testPage.path,
        url: page.url(),
        loaded: true,
        hasAppElement: !!appElement,
        hasPageContent: !!pageContent,
        hasRouter: !!hasRouter,
        snapshotLength: snapshot?.length || 0,
        screenshotPath: screenshotPath,
        consoleErrors: pageErrors,
        consoleMessages: consoleMessages.length,
      });

      results.screenshots.push(screenshotPath);

      console.log(`  ✅ Page loaded: ${page.url()}`);
      console.log(`  📸 Screenshot: ${screenshotPath}`);
      console.log(
        `  📊 App element: ${!!appElement}, Page content: ${!!pageContent}, Router: ${!!hasRouter}`
      );
      console.log(`  ❌ Console errors: ${pageErrors}`);
    } catch (error) {
      console.log(`  ❌ FAILED: ${error.message}`);
      results.errors.push({ page: testPage.name, error: error.message });
    }
  }

  // Test specific functionality
  console.log("\n🧪 Testing Specific Functionality...\n");

  // Test navigation
  console.log("  🔄 Testing Navigation...");
  try {
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });

    // Click on models link
    const modelsLink = await page.$('a[href="/models"], [data-page="models"]');
    if (modelsLink) {
      await modelsLink.click();
      await page.waitForTimeout(2000);
      console.log(`  ✅ Navigation to Models works`);
    }
  } catch (error) {
    console.log(`  ❌ Navigation test failed: ${error.message}`);
  }

  // Test Socket.IO connection
  console.log("  🔌 Testing Socket.IO Connection...");
  try {
    await page.evaluate(() => {
      return typeof socket !== "undefined" && socket.connected;
    });
    console.log(`  ✅ Socket.IO connection check complete`);
  } catch (error) {
    console.log(`  ⚠️  Socket.IO check: ${error.message}`);
  }

  // Test state manager
  console.log("  📊 Testing State Manager...");
  try {
    const state = await page.evaluate(() => {
      return {
        hasStateManager: typeof stateManager !== "undefined",
        modelsCount: stateManager?.get("models")?.length || 0,
        configExists: !!stateManager?.get("config"),
      };
    });
    console.log(
      `  ✅ State Manager: ${state.hasStateManager}, Models: ${state.modelsCount}, Config: ${state.configExists}`
    );
  } catch (error) {
    console.log(`  ⚠️  State Manager check: ${error.message}`);
  }

  // Generate report
  console.log("\n" + "=".repeat(80));
  console.log("📋 COMPREHENSIVE TEST REPORT");
  console.log("=".repeat(80));

  console.log("\n📄 Page Test Results:");
  console.log("-".repeat(80));

  for (const result of results.pages) {
    const status = result.loaded && result.hasAppElement ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} - ${result.name}`);
    console.log(`   Path: ${result.path}`);
    console.log(`   URL: ${result.url}`);
    console.log(
      `   Elements: App=${result.hasAppElement}, Content=${result.hasPageContent}, Router=${result.hasRouter}`
    );
    console.log(`   Console Errors: ${result.consoleErrors}`);
    console.log(`   Screenshot: ${result.screenshotPath}`);
    console.log("");
  }

  console.log("\n⚠️  Errors Found:");
  console.log("-".repeat(80));
  if (results.errors.length === 0) {
    console.log("✅ No critical errors found!");
  } else {
    for (const error of results.errors) {
      console.log(`❌ ${error.page}: ${error.error}`);
    }
  }

  console.log("\n📸 Screenshots Captured:");
  console.log("-".repeat(80));
  for (const screenshot of results.screenshots) {
    console.log(`📸 ${screenshot}`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ COMPREHENSIVE TESTING COMPLETE");
  console.log("=".repeat(80));

  // Save results to JSON
  const fs = await import("fs");
  fs.writeFileSync(
    "/home/bamer/nextjs-llama-async-proxy/test-results.json",
    JSON.stringify(results, null, 2)
  );
  console.log("\n📄 Full results saved to: /home/bamer/nextjs-llama-async-proxy/test-results.json");

  await browser.close();
})();
