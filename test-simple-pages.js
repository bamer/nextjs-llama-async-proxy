/**
 * Simple Page Testing Script
 * Tests page loading without console errors
 */

import { chromium } from "playwright";

(async () => {
  console.log("🚀 Starting Simple Page Testing...\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  // Track errors
  const results = {
    pages: [],
    errors: [],
    screenshots: [],
  };

  // Listen for console errors only
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
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

      // Wait for content to load
      await page.waitForTimeout(3000);

      // Check for key elements
      const appElement = await page.$("#app");
      const pageContent = await page.$("#page-content");
      const mainContent = await page.$(".main-content, .page-content");

      // Take screenshot
      const screenshotPath = `/home/bamer/nextjs-llama-async-proxy/screenshots/${testPage.name.toLowerCase().replace(/\s+/g, "-")}.png`;
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
        quality: 80,
      });

      // Filter errors for this page only
      const currentErrors = consoleErrors.filter(
        (e) => e.includes(testPage.name) || e.includes("Component") || e.includes("is not defined")
      );

      // Store results
      results.pages.push({
        name: testPage.name,
        path: testPage.path,
        url: page.url(),
        loaded: true,
        hasAppElement: !!appElement,
        hasPageContent: !!pageContent || !!mainContent,
        screenshotPath: screenshotPath,
        errorCount: currentErrors.length,
        errors: currentErrors.slice(0, 3), // Store first 3 errors
      });

      results.screenshots.push(screenshotPath);

      console.log(`  ✅ Page loaded: ${page.url()}`);
      console.log(`  📸 Screenshot: ${screenshotPath}`);
      console.log(`  📊 Elements: App=${!!appElement}, Content=${!!pageContent || !!mainContent}`);
      console.log(`  ❌ Console errors: ${currentErrors.length}`);

      if (currentErrors.length > 0) {
        console.log(`  ⚠️  First error: ${currentErrors[0].substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`  ❌ FAILED: ${error.message}`);
      results.errors.push({ page: testPage.name, error: error.message });
    }
  }

  // Generate report
  console.log("\n" + "=".repeat(80));
  console.log("📋 PAGE TEST REPORT");
  console.log("=".repeat(80));

  console.log("\n📄 Page Test Results:");
  console.log("-".repeat(80));

  let totalErrors = 0;
  let passedPages = 0;

  for (const result of results.pages) {
    const status = result.loaded && result.hasAppElement ? "✅ PASS" : "❌ FAIL";
    if (result.errorCount === 0 && result.loaded) passedPages++;
    totalErrors += result.errorCount;

    console.log(`${status} - ${result.name}`);
    console.log(`   Path: ${result.path} | URL: ${result.url}`);
    console.log(`   Elements: App=${result.hasAppElement}, Content=${result.hasPageContent}`);
    console.log(
      `   Errors: ${result.errorCount} | Screenshot: ${result.screenshotPath.split("/").pop()}`
    );
    console.log("");
  }

  console.log("\n📊 Summary:");
  console.log(`   Total Pages Tested: ${results.pages.length}`);
  console.log(`   Pages Passed: ${passedPages}/${results.pages.length}`);
  console.log(`   Total Console Errors: ${totalErrors}`);
  console.log(`   Screenshots Captured: ${results.screenshots.length}`);

  console.log("\n📸 Screenshots:");
  for (const screenshot of results.screenshots) {
    console.log(`   📸 ${screenshot}`);
  }

  if (results.errors.length > 0) {
    console.log("\n⚠️  Critical Errors:");
    for (const error of results.errors) {
      console.log(`   ❌ ${error.page}: ${error.error}`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ PAGE TESTING COMPLETE");
  console.log("=".repeat(80));

  await browser.close();
})();
