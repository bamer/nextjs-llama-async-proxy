/**
 * Browser Integration Test Script - Dashboard Page Modularization Test
 */

import { chromium } from "playwright";

async function testDashboardModularization() {
  console.log("=".repeat(60));
  console.log("PLAYWRIGHT TEST: Dashboard Page Modularization");
  console.log("=".repeat(60));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const logs = [];

  // Capture console messages
  page.on("console", (msg) => {
    const text = msg.text();
    logs.push({ type: msg.type(), text });
    // Log debug messages and errors
    if (msg.type() === "log" || msg.type() === "error") {
      console.log(`[CONSOLE ${msg.type()}] ${text}`);
    }
  });

  // Capture page errors
  page.on("pageerror", (error) => {
    console.error("[PAGE ERROR]", error.message);
    errors.push(error.message);
  });

  try {
    // Step 1: Navigate to dashboard page
    console.log("\n[STEP 1] Navigating to Dashboard page...");
    await page.goto("http://localhost:3000/", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    console.log("[STEP 1] Page loaded");

    // Wait for Socket.IO connection
    await page.waitForTimeout(2000);

    // Step 2: Check if main dashboard elements exist
    console.log("\n[STEP 2] Checking main dashboard elements...");

    const dashboardPage = await page.$(".dashboard-page");
    console.log("  Dashboard page container:", !!dashboardPage);

    const routerCard = await page.$(".router-card");
    console.log("  Router card:", !!routerCard);

    const statsGrid = await page.$(".stats-grid");
    console.log("  Stats grid:", !!statsGrid);

    const chartsSection = await page.$(".charts-section");
    console.log("  Charts section:", !!chartsSection);

    const healthSection = await page.$(".health-section");
    console.log("  Health section:", !!healthSection);

    const actionsSection = await page.$(".actions-section");
    console.log("  Actions section:", !!actionsSection);

    // Step 3: Check for stat cards
    console.log("\n[STEP 3] Checking stat cards...");
    const statCards = await page.$$(".stat-card");
    console.log("  Stat cards count:", statCards.length);

    // Step 4: Check for health checks
    console.log("\n[STEP 4] Checking health checks...");
    const healthChecks = await page.$$(".health-check");
    console.log("  Health checks count:", healthChecks.length);

    // Step 5: Check action buttons
    console.log("\n[STEP 5] Checking action buttons...");
    const actionButtons = await page.$$(".action-buttons .btn");
    console.log("  Action buttons count:", actionButtons.length);

    // Step 6: Check router controls
    console.log("\n[STEP 6] Checking router controls...");
    const routerControls = await page.$(".router-controls");
    console.log("  Router controls:", !!routerControls);

    const startStopButton = await page.$('[data-action="start"], [data-action="stop"]');
    console.log("  Start/Stop button:", !!startStopButton);

    const restartButton = await page.$('[data-action="restart"]');
    console.log("  Restart button:", !!restartButton);

    // Step 7: Check for any JavaScript errors related to modules
    console.log("\n[STEP 7] Checking for module-related errors...");
    const moduleErrors = logs.filter(
      (l) =>
        l.type === "error" &&
        (l.text.includes("Module") ||
          l.text.includes("import") ||
          l.text.includes("export") ||
          l.text.includes("ChartManager") ||
          l.text.includes("StatsGrid") ||
          l.text.includes("ChartsSection") ||
          l.text.includes("SystemHealth") ||
          l.text.includes("RouterCard") ||
          l.text.includes("QuickActions"))
    );
    console.log("  Module-related errors:", moduleErrors.length);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`Dashboard page exists: ${!!dashboardPage}`);
    console.log(`Router card exists: ${!!routerCard}`);
    console.log(`Stats grid exists: ${!!statsGrid}`);
    console.log(`Charts section exists: ${!!chartsSection}`);
    console.log(`Health section exists: ${!!healthSection}`);
    console.log(`Actions section exists: ${!!actionsSection}`);
    console.log(`Stat cards count: ${statCards.length}`);
    console.log(`Health checks count: ${healthChecks.length}`);
    console.log(`Total page errors: ${errors.length}`);

    // Success criteria
    const allComponentsExist =
      dashboardPage && routerCard && statsGrid && chartsSection && healthSection && actionsSection;
    const hasExpectedStats = statCards.length >= 4;
    const hasExpectedHealthChecks = healthChecks.length >= 2;
    const noModuleErrors = moduleErrors.length === 0;

    console.log("\nSuccess criteria:");
    console.log(`  All main components exist: ${allComponentsExist}`);
    console.log(`  Has expected stat cards (>=4): ${hasExpectedStats}`);
    console.log(`  Has expected health checks (>=2): ${hasExpectedHealthChecks}`);
    console.log(`  No module-related errors: ${noModuleErrors}`);

    const testPassed =
      allComponentsExist &&
      hasExpectedStats &&
      hasExpectedHealthChecks &&
      noModuleErrors &&
      errors.length === 0;

    console.log("\n" + (testPassed ? "✓ TEST PASSED" : "✗ TEST NEEDS INVESTIGATION"));

    if (errors.length > 0) {
      console.log("\nPage errors:");
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    return testPassed;
  } catch (error) {
    console.error("\n[TEST ERROR]", error.message);
    errors.push(error.message);
    return false;
  } finally {
    await browser.close();
    console.log("\n" + "=".repeat(60));
    console.log("TEST COMPLETE");
    console.log("=".repeat(60));
  }
}

testDashboardModularization()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
