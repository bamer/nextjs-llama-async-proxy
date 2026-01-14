/**
 * Golden Rule Testing Script using Playwright
 *
 * This script performs comprehensive browser testing following the Golden Rule methodology:
 * - Open real browser
 * - Navigate through all pages
 * - Click every interactive element
 * - Take screenshots
 * - Check for console errors
 *
 * Usage: node test-golden-rule-playwright.js
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = "./screenshots";

console.log("=== GOLDEN RULE TESTING WITH PLAYWRIGHT ===\n");

async function runTests() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  const results = {
    timestamp: new Date().toISOString(),
    pages: [],
    summary: { passed: 0, failed: 0, errors: 0 },
    networkErrors: [], // New property to store network errors
  };

  // Collect console messages
  const consoleMessages = [];
  page.on("console", (msg) => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: Date.now(),
      location: msg.location(),
    });
  });

  // Collect page errors
  const pageErrors = [];
  page.on("pageerror", (error) => {
    pageErrors.push({
      message: error.message,
      stack: error.stack,
    });
  });

  // NEW: Collect network request failures
  page.on("requestfailed", (request) => {
    results.networkErrors.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure().errorText,
      resourceType: request.resourceType(),
      timestamp: Date.now(),
    });
  });

  // Test pages
  const pages = [
    { name: "Dashboard", path: "/" },
    { name: "Models", path: "/models" },
    { name: "Presets", path: "/presets" },
    { name: "Settings", path: "/settings" },
    { name: "Logs", path: "/logs" },
    { name: "Monitoring", path: "/monitoring" },
  ];

  for (const pageInfo of pages) {
    console.log(`Testing ${pageInfo.name} page...`);

    const pageResult = {
      name: pageInfo.name,
      url: `${BASE_URL}${pageInfo.path}`,
      status: "pending",
      screenshot: null,
      errors: [],
      warnings: [],
      elements: {
        buttons: 0,
        links: 0,
        inputs: 0,
        interactive: 0,
      },
    };

    try {
      // Navigate to page
      await page.goto(pageResult.url, { waitUntil: "networkidle", timeout: 30000 });

      // Wait for page to settle
      await page.waitForTimeout(2000);

      // Take screenshot
      const screenshotPath = `${SCREENSHOT_DIR}/golden-${pageInfo.name.toLowerCase()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      pageResult.screenshot = screenshotPath;
      console.log(`  ✅ Screenshot: ${screenshotPath}`);

      // Count and click buttons
      const buttons = await page.$$("button");
      pageResult.elements.buttons = buttons.length;
      console.log(`  🔘 Found ${buttons.length} buttons`);

      for (const button of buttons) {
        try {
          await button.click().catch(() => {});
          await page.waitForTimeout(100);
        } catch (e) {
          // Button click failed, continue
        }
      }

      // Count and click links
      const links = await page.$$("a");
      pageResult.elements.links = links.length;
      console.log(`  🔗 Found ${links.length} links`);

      // Count and interact with inputs
      const inputs = await page.$$("input, select, textarea");
      pageResult.elements.inputs = inputs.length;
      console.log(`  📝 Found ${inputs.length} inputs`);

      // Click all interactive elements
      const interactiveSelectors = [
        "[data-action]",
        "[data-page]",
        "[data-target]",
        ".btn",
        ".button",
        ".nav-item",
        ".menu-item",
      ];

      for (const selector of interactiveSelectors) {
        const elements = await page.$$(selector);
        for (const element of elements) {
          try {
            await element.click().catch(() => {});
            await page.waitForTimeout(100);
          } catch (e) {
            // Element click failed, continue
          }
        }
      }

      // Count interactive elements
      const allInteractive = await page.$$(
        "button, a, input, select, textarea, [data-action], [data-page]"
      );
      pageResult.elements.interactive = allInteractive.length;
      console.log(`  🎯 Found ${pageResult.elements.interactive} interactive elements`);

      // Check for errors on this page
      const pageConsoleErrors = consoleMessages.filter(
        (m) => m.type === "error" && m.text.includes("Failed to load module script") // Use m.text directly
      );

      const pageJsErrors = pageErrors.filter(
        (e) => e.message.includes(pageInfo.name.toLowerCase()) || !e.stack?.includes("other")
      );

      // Filter network errors specific to this page load
      const pageNetworkErrors = results.networkErrors.filter(
        (e) =>
          e.url.startsWith(BASE_URL + pageInfo.path) || // errors for current page
          (e.resourceType === "script" && e.url.startsWith(BASE_URL + "/js/")) // errors for script modules
      );

      if (pageConsoleErrors.length > 0 || pageJsErrors.length > 0 || pageNetworkErrors.length > 0) {
        // Update condition
        pageResult.errors = [
          ...pageConsoleErrors.map((m) => ({
            type: "console",
            message: m.text,
            url: m.location?.url || "N/A",
          })), // Use m.text and m.location?.url
          ...pageJsErrors.map((e) => ({ type: "javascript", message: e.message })),
          ...pageNetworkErrors.map((e) => ({
            type: "network",
            message: `Failed to load ${e.resourceType} at ${e.url}: ${e.failure}`,
            url: e.url,
          })), // Add network errors
        ];
        pageResult.status = "FAILED";
        results.summary.failed++;
        console.log(`  ❌ Errors found: ${pageResult.errors.length}`);
        // NEW: Log specific error details to console
        pageResult.errors.forEach((err) =>
          console.error(
            `    - [${err.type.toUpperCase()}] ${err.url ? `(${err.url}) ` : ""}${err.message}`
          )
        );
      } else {
        pageResult.status = "PASSED";
        results.summary.passed++;
        console.log(`  ✅ No errors found`);
      }
    } catch (error) {
      pageResult.status = "ERROR";
      pageResult.errors.push({ type: "navigation", message: error.message });
      results.summary.errors++;
      console.log(`  ❌ Error: ${error.message}`);
    }

    results.pages.push(pageResult);
    console.log("");
  }

  await browser.close();

  // Generate report
  console.log("=== TEST SUMMARY ===");
  console.log(`Total Pages: ${results.pages.length}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⚠️ Errors: ${results.summary.errors}`);

  // Save results
  const reportPath = "./test-results.json";
  writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Results saved to: ${reportPath}`);

  return results;
}

runTests().catch(console.error);
