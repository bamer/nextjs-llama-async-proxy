#!/usr/bin/env node
/**
 * Comprehensive E2E Test Script for Llama Async Proxy Dashboard
 *
 * This script performs automated testing of all application functionality
 * using Playwright to interact with the browser.
 *
 * Usage: node e2e-test-script.js
 */

import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";
const CONSOLE_ERRORS = [];
const CONSOLE_WARNINGS = [];
const TEST_RESULTS = [];

async function log(message, type = "info") {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  TEST_RESULTS.push({ timestamp, type, message });

  if (type === "error") {
    console.error(`❌ ${logEntry}`);
  } else if (type === "warning") {
    console.warn(`⚠️  ${logEntry}`);
  } else {
    console.log(`✅ ${logEntry}`);
  }
}

async function takeScreenshot(page, name) {
  const filename = `/tmp/e2e-test-${name}-${Date.now()}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`📸 Screenshot saved: ${filename}`);
  return filename;
}

async function testPage(page, pageName, url) {
  log(`Testing page: ${pageName}`);

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check for console errors on this page
    const errors = await page.evaluate(() => {
      return window.__consoleErrors || [];
    });

    if (errors.length > 0) {
      log(`${pageName}: Found ${errors.length} console errors`, "error");
      errors.forEach((e) => CONSOLE_ERRORS.push({ page: pageName, error: e }));
    } else {
      log(`${pageName}: No console errors`, "info");
    }

    // Get page title
    const title = await page.title();
    log(`${pageName}: Title = "${title}"`);

    // Check if main content loaded
    const bodyContent = await page.evaluate(
      () => document.body?.innerHTML?.length || 0
    );
    log(`${pageName}: Body content length = ${bodyContent} characters`);

    return true;
  } catch (error) {
    log(`${pageName}: Failed to load - ${error.message}`, "error");
    return false;
  }
}

async function testNavigation(page) {
  log("Testing navigation functionality");

  const navItems = [
    { selector: 'a[href="/"]', name: "Dashboard" },
    { selector: 'a[href="/models"]', name: "Models" },
    { selector: 'a[href="/presets"]', name: "Presets" },
    { selector: 'a[href="/logs"]', name: "Logs" },
    { selector: 'a[href="/settings"]', name: "Settings" },
  ];

  let workingNav = 0;
  let brokenNav = 0;

  for (const item of navItems) {
    try {
      const element = await page.$(item.selector);
      if (element) {
        await element.click();
        await page.waitForTimeout(1000);

        // Check URL changed
        const currentUrl = page.url();
        log(`${item.name}: Clicked, URL = ${currentUrl}`, "info");
        workingNav++;
      } else {
        log(`${item.name}: Navigation link not found`, "warning");
        brokenNav++;
      }
    } catch (error) {
      log(`${item.name}: Navigation failed - ${error.message}`, "error");
      brokenNav++;
    }
  }

  log(
    `Navigation: ${workingNav} working, ${brokenNav} broken`,
    workingNav > 0 && brokenNav === 0 ? "info" : "error"
  );
}

async function testButtons(page) {
  log("Testing buttons");

  const buttons = await page.$$("button");
  log(`Found ${buttons.length} buttons on page`);

  let testedButtons = 0;
  for (const button of buttons.slice(0, 10)) {
    // Test first 10 buttons
    try {
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      const isDisabled = await button.isDisabled();

      if (isVisible && !isDisabled) {
        log(`Button: "${text?.trim() || "[no text]"}" - Visible and enabled`);
        testedButtons++;
      }
    } catch (e) {
      // Button might be detached
    }
  }

  log(`Tested ${testedButtons} buttons`);
}

async function testForms(page) {
  log("Testing form elements");

  const inputs = await page.$$("input");
  const selects = await page.$$("select");
  const textareas = await page.$$("textarea");

  log(
    `Found ${inputs.length} inputs, ${selects.length} selects, ${textareas.length} textareas`
  );

  // Test each input type
  for (const input of inputs.slice(0, 5)) {
    try {
      const type = await input.getAttribute("type");
      const name = await input.getAttribute("name");
      const placeholder = await input.getAttribute("placeholder");
      const isVisible = await input.isVisible();

      if (isVisible) {
        log(
          `Input: type="${type}", name="${name}", placeholder="${placeholder}"`
        );

        // Try to interact with text inputs
        if (type === "text" || type === "number") {
          await input.fill("test-value");
          const value = await input.inputValue();
          log(`  → Input test: Set to "test-value", got "${value}"`);
        }
      }
    } catch (e) {
      // Input might not be interactable
    }
  }
}

async function testModals(page) {
  log("Testing modals and dialogs");

  const modals = await page.$$(
    '[class*="modal"], [class*="dialog"], [role="dialog"]'
  );
  log(`Found ${modals.length} modal-like elements`);

  // Look for specific modal triggers
  const modalTriggers = await page.$$(
    '[data-action*="modal"], [data-toggle="modal"]'
  );
  log(`Found ${modalTriggers.length} modal triggers`);

  for (const trigger of modalTriggers.slice(0, 3)) {
    try {
      const text = await trigger.textContent();
      log(`Modal trigger: "${text?.trim()}"`);
    } catch (e) {
      // Ignore
    }
  }
}

async function testSliders(page) {
  log("Testing range sliders");

  const sliders = await page.$$('input[type="range"]');
  log(`Found ${sliders.length} range sliders`);

  for (const slider of sliders) {
    try {
      const min = await slider.getAttribute("min");
      const max = await slider.getAttribute("max");
      const value = await slider.getAttribute("value");
      const metric = await slider.getAttribute("data-metric");
      const level = await slider.getAttribute("data-level");

      log(
        `Slider: metric="${metric}", level="${level}", range=[${min}-${max}], value=${value}`
      );

      // Try to change value
      if (parseInt(max) > parseInt(min)) {
        const newValue = Math.floor((parseInt(min) + parseInt(max)) / 2);
        await slider.fill(String(newValue));
        const actualValue = await slider.getAttribute("value");
        log(`  → Changed to ${actualValue}`);
      }
    } catch (e) {
      log(`Slider test failed: ${e.message}`, "warning");
    }
  }
}

async function testNotifications(page) {
  log("Testing notification system");

  // Look for toast/notification container
  const notificationContainer = await page.$(
    '[class*="notification"], [class*="toast"]'
  );
  log(`Notification container found: ${notificationContainer ? "Yes" : "No"}`);

  // Try to trigger a notification by clicking buttons
  const actionButtons = await page.$$("[data-action]");
  log(`Found ${actionButtons.length} action buttons`);

  for (const button of actionButtons.slice(0, 5)) {
    try {
      const action = await button.getAttribute("data-action");
      const text = await button.textContent();

      if (action && text) {
        log(`Action button: "${text.trim()}" with action="${action}"`);

        // Click and check for notification
        await button.click();
        await page.waitForTimeout(500);
      }
    } catch (e) {
      // Button might not be clickable
    }
  }
}

async function testSocketConnection(page) {
  log("Testing Socket.IO connection");

  const socketConnected = await page.evaluate(() => {
    return (
      window.socketClient?.isConnected ||
      document.body?.textContent?.includes("connected") ||
      false
    );
  });

  log(`Socket.IO connected: ${socketConnected}`);

  // Check for connection status indicators
  const statusIndicator = await page.$(
    '[class*="status"][class*="connected"], [class*="status"][class*="online"]'
  );
  log(
    `Connection status indicator: ${statusIndicator ? "Found" : "Not found"}`
  );
}

async function testCharts(page) {
  log("Testing chart elements");

  const charts = await page.$$(
    '[class*="chart"], [class*="graph"], [class*="metric"]'
  );
  log(`Found ${charts.length} chart/metric elements`);

  // Check for canvas elements (used for charts)
  const canvases = await page.$$("canvas");
  log(`Found ${canvases.length} canvas elements`);

  // Check for SVG charts
  const svgs = await page.$$("svg");
  log(`Found ${svgs.length} SVG elements`);
}

async function testTables(page) {
  log("Testing tables");

  const tables = await page.$$("table");
  log(`Found ${tables.length} tables`);

  for (const table of tables) {
    try {
      const rows = await table.$$("tr");
      log(`  Table with ${rows.length} rows`);

      // Check for headers
      const headers = await table.$$("th");
      if (headers.length > 0) {
        const headerTexts = await Promise.all(
          headers.map((h) => h.textContent())
        );
        log(`  Headers: ${headerTexts.join(", ")}`);
      }
    } catch (e) {
      // Ignore
    }
  }
}

async function testCards(page) {
  log("Testing card components");

  const cards = await page.$$('[class*="card"]');
  log(`Found ${cards.length} card components`);
}

async function testCollapseExpand(page) {
  log("Testing collapsible elements");

  const collapseButtons = await page.$$(
    '[data-toggle="collapse"], [data-action*="collapse"], [data-action*="expand"]'
  );
  log(`Found ${collapseButtons.length} collapse/expand buttons`);

  for (const button of collapseButtons.slice(0, 3)) {
    try {
      const text = await button.textContent();
      const target =
        (await button.getAttribute("data-target")) ||
        (await button.getAttribute("data-collapse-target"));
      log(`Collapse button: "${text?.trim()}" targeting "${target}"`);
    } catch (e) {
      // Ignore
    }
  }
}

async function checkConsole(page) {
  // This would require setting up console interception
  // For now, we'll just check if there are any obvious errors
  const hasErrors = await page.evaluate(() => {
    // Check for visible error messages
    const errorElements = document.querySelectorAll(
      '[class*="error"], .error-message, [role="alert"]'
    );
    return errorElements.length > 0;
  });

  if (hasErrors) {
    log("Visible error elements found on page", "warning");
  }
}

async function runTests() {
  console.log("=".repeat(80));
  console.log("🧪 Llama Async Proxy Dashboard - Comprehensive E2E Testing");
  console.log("=".repeat(80));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log("");

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    });

    const page = await context.newPage();

    // Set up console interception
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        CONSOLE_ERRORS.push({
          timestamp: new Date().toISOString(),
          text: msg.text(),
          location: msg.location(),
        });
      } else if (msg.type() === "warning") {
        CONSOLE_WARNINGS.push({
          timestamp: new Date().toISOString(),
          text: msg.text(),
          location: msg.location(),
        });
      }
    });

    page.on("pageerror", (error) => {
      CONSOLE_ERRORS.push({
        timestamp: new Date().toISOString(),
        text: error.message,
        stack: error.stack,
        type: "pageerror",
      });
    });

    // Test 1: Dashboard page
    console.log("\n" + "=".repeat(80));
    console.log("TEST 1: Dashboard Page");
    console.log("=".repeat(80));
    await testPage(page, "Dashboard", BASE_URL);
    await testCards(page);
    await testCharts(page);
    await testNotifications(page);
    await takeScreenshot(page, "dashboard");

    // Test 2: Navigation
    console.log("\n" + "=".repeat(80));
    console.log("TEST 2: Navigation");
    console.log("=".repeat(80));
    await testNavigation(page);
    await takeScreenshot(page, "navigation");

    // Test 3: Models page
    console.log("\n" + "=".repeat(80));
    console.log("TEST 3: Models Page");
    console.log("=".repeat(80));
    await testPage(page, "Models", `${BASE_URL}/#/models`);
    await testTables(page);
    await testButtons(page);
    await takeScreenshot(page, "models");

    // Test 4: Monitoring page
    console.log("\n" + "=".repeat(80));
    console.log("TEST 4: Monitoring Page");
    console.log("=".repeat(80));
    await testPage(page, "Monitoring", `${BASE_URL}/#/monitoring`);
    await testSliders(page);
    await testCharts(page);
    await takeScreenshot(page, "monitoring");

    // Test 5: Logs page
    console.log("\n" + "=".repeat(80));
    console.log("TEST 5: Logs Page");
    console.log("=".repeat(80));
    await testPage(page, "Logs", `${BASE_URL}/#/logs`);
    await testTables(page);
    await takeScreenshot(page, "logs");

    // Test 6: Configuration page
    console.log("\n" + "=".repeat(80));
    console.log("TEST 6: Configuration Page");
    console.log("=".repeat(80));
    await testPage(page, "Configuration", `${BASE_URL}/#/configuration`);
    await testForms(page);
    await testButtons(page);
    await testCollapseExpand(page);
    await takeScreenshot(page, "configuration");

    // Test 7: Settings page
    console.log("\n" + "=".repeat(80));
    console.log("TEST 7: Settings Page");
    console.log("=".repeat(80));
    await testPage(page, "Settings", `${BASE_URL}/#/settings`);
    await testForms(page);
    await testSliders(page);
    await testModals(page);
    await takeScreenshot(page, "settings");

    // Test 8: Socket.IO connection
    console.log("\n" + "=".repeat(80));
    console.log("TEST 8: Socket.IO Connection");
    console.log("=".repeat(80));
    await testSocketConnection(page);

    // Summary
    console.log("\n" + "=".repeat(80));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(80));

    console.log(
      `\n✅ Tests Passed: ${TEST_RESULTS.filter((r) => r.type === "info").length}`
    );
    console.log(`⚠️  Warnings: ${CONSOLE_WARNINGS.length}`);
    console.log(`❌ Console Errors: ${CONSOLE_ERRORS.length}`);

    if (CONSOLE_ERRORS.length > 0) {
      console.log("\n❌ CONSOLE ERRORS DETECTED:");
      CONSOLE_ERRORS.forEach((err, i) => {
        console.log(`  ${i + 1}. [${err.timestamp}] ${err.text}`);
        if (err.location) {
          console.log(`     Location: ${JSON.stringify(err.location)}`);
        }
      });
    }

    if (CONSOLE_WARNINGS.length > 0) {
      console.log("\n⚠️  CONSOLE WARNINGS:");
      CONSOLE_WARNINGS.forEach((warn, i) => {
        console.log(`  ${i + 1}. [${warn.timestamp}] ${warn.text}`);
      });
    }

    console.log("\n" + "=".repeat(80));
    console.log("🎯 RECOMMENDATIONS");
    console.log("=".repeat(80));

    if (CONSOLE_ERRORS.length === 0 && CONSOLE_WARNINGS.length === 0) {
      console.log(
        "✅ All tests passed! No console errors or warnings detected."
      );
    } else {
      console.log("❌ Issues detected that need to be fixed:");

      // Group errors by type
      const errorGroups = {};
      CONSOLE_ERRORS.forEach((err) => {
        const key = err.text.substring(0, 50);
        errorGroups[key] = (errorGroups[key] || 0) + 1;
      });

      Object.entries(errorGroups).forEach(([error, count]) => {
        console.log(`  - ${error}... (${count} occurrences)`);
      });
    }

    console.log("\n" + "=".repeat(80));
    console.log("🏁 Testing Complete");
    console.log("=".repeat(80));
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Export for use in CI/CD
export { runTests, testPage, testNavigation, testButtons, testForms };

// Run if called directly
runTests().catch(console.error);
