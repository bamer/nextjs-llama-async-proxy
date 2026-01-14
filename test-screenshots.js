/**
 * Comprehensive Screenshot Testing
 * Takes screenshots of all pages for release documentation
 */

import { chromium } from "playwright";

(async () => {
  console.log("📸 Starting Comprehensive Screenshot Testing...\n");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const pageObj = await browser.newPage();

  // Pages to screenshot
  const pages = [
    { path: "/", name: "Dashboard", description: "Main dashboard with metrics overview" },
    { path: "/models", name: "Models", description: "Models management page" },
    { path: "/presets", name: "Presets", description: "Presets configuration" },
    { path: "/settings", name: "Settings", description: "Application settings" },
    { path: "/logs", name: "Logs", description: "Logs viewer" },
    { path: "/monitoring", name: "Monitoring", description: "Monitoring and metrics" },
  ];

  const results = {
    timestamp: new Date().toISOString(),
    pages: [],
    errors: [],
    totalScreenshots: 0,
  };

  // Listen for errors
  pageObj.on("pageerror", (error) => {
    results.errors.push({ page: pageObj.url(), error: error.message });
  });

  console.log("=".repeat(80));
  console.log("📸 COMPREHENSIVE SCREENSHOT TESTING");
  console.log("=".repeat(80));

  // Test each page
  for (const testPage of pages) {
    console.log(`\n📄 ${testPage.name} (${testPage.path})`);
    console.log(`   ${testPage.description}`);

    try {
      // Navigate to page
      await pageObj.goto(`http://localhost:3000${testPage.path}`, {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      // Wait for content to render
      await pageObj.waitForTimeout(3000);

      // Check page status
      const appExists = (await pageObj.$("#app")) !== null;
      const contentExists =
        (await pageObj.$(
          "#page-content, .main-content, .page-content, .dashboard-page, .models-page"
        )) !== null;

      // Generate screenshot filename
      const screenshotName = `screenshot-${testPage.name.toLowerCase()}-${Date.now()}.png`;
      const screenshotPath = `/home/bamer/nextjs-llama-async-proxy/screenshots/${screenshotName}`;

      // Take screenshot
      await pageObj.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      results.totalScreenshots++;

      // Store result
      results.pages.push({
        name: testPage.name,
        path: testPage.path,
        screenshot: screenshotName,
        appElement: appExists,
        contentElement: contentExists,
        status: appExists && contentExists ? "✅ PASS" : "⚠️ PARTIAL",
      });

      console.log(`   ✅ Status: ${appExists && contentExists ? "PASS" : "PARTIAL"}`);
      console.log(`   📸 Screenshot: ${screenshotName}`);
      console.log(`   📊 Elements: App=${appExists}, Content=${contentExists}`);
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      results.errors.push({ page: testPage.name, error: error.message });
    }
  }

  // Test functionality
  console.log("\n" + "=".repeat(80));
  console.log("🧪 FUNCTIONALITY TESTS");
  console.log("=".repeat(80));

  // Test navigation
  console.log("\n🔄 Testing navigation...");
  try {
    await pageObj.goto("http://localhost:3000/", { waitUntil: "networkidle" });

    // Check if router is working
    const routerWorking = await pageObj.evaluate(() => {
      return typeof window.router !== "undefined" && typeof window.router.navigate === "function";
    });

    console.log(
      `   ${routerWorking ? "✅" : "❌"} Router: ${routerWorking ? "Working" : "Not found"}`
    );
  } catch (error) {
    console.log(`   ❌ Navigation test failed: ${error.message}`);
  }

  // Test Socket.IO
  console.log("\n🔌 Testing Socket.IO connection...");
  try {
    const socketWorking = await pageObj.evaluate(() => {
      return typeof socket !== "undefined" && typeof socket.connect === "function";
    });

    console.log(
      `   ${socketWorking ? "✅" : "❌"} Socket.IO: ${socketWorking ? "Available" : "Not found"}`
    );
  } catch (error) {
    console.log(`   ❌ Socket.IO test failed: ${error.message}`);
  }

  // Test State Manager
  console.log("\n📊 Testing State Manager...");
  try {
    const stateWorking = await pageObj.evaluate(() => {
      return typeof stateManager !== "undefined" && typeof stateManager.get === "function";
    });

    console.log(
      `   ${stateWorking ? "✅" : "❌"} State Manager: ${stateWorking ? "Available" : "Not found"}`
    );
  } catch (error) {
    console.log(`   ❌ State Manager test failed: ${error.message}`);
  }

  // Generate summary
  console.log("\n" + "=".repeat(80));
  console.log("📋 SUMMARY REPORT");
  console.log("=".repeat(80));

  console.log("\n📸 Screenshots Captured:");
  console.log("-".repeat(80));

  for (const result of results.pages) {
    console.log(`   ${result.status} ${result.name.padEnd(15)} → ${result.screenshot}`);
  }

  console.log(`\n📊 Total Screenshots: ${results.totalScreenshots}/${pages.length}`);

  if (results.errors.length > 0) {
    console.log(`\n❌ Errors Encountered: ${results.errors.length}`);
    console.log("-".repeat(80));
    for (const error of results.errors) {
      console.log(`   ${error.page}: ${error.error.substring(0, 100)}`);
    }
  } else {
    console.log(`\n✅ No critical errors encountered!`);
  }

  // List all screenshots
  console.log("\n📁 Screenshot Files:");
  console.log("-".repeat(80));
  const fs = await import("fs");
  const files = fs
    .readdirSync("/home/bamer/nextjs-llama-async-proxy/screenshots")
    .filter((f) => f.startsWith("screenshot-") && f.endsWith(".png"))
    .sort();

  files.forEach((file) => {
    const stats = fs.statSync(`/home/bamer/nextjs-llama-async-proxy/screenshots/${file}`);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`   📸 ${file} (${sizeKB} KB)`);
  });

  console.log("\n" + "=".repeat(80));
  console.log("✅ COMPREHENSIVE SCREENSHOT TESTING COMPLETE");
  console.log("=".repeat(80));

  // Save results
  fs.writeFileSync(
    "/home/bamer/nextjs-llama-async-proxy/screenshot-results.json",
    JSON.stringify(results, null, 2)
  );
  console.log("\n📄 Results saved to: screenshot-results.json");

  await browser.close();
})();
