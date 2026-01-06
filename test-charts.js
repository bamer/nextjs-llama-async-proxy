/**
 * Browser Integration Test Script - Dashboard Charts Test
 */

import { chromium } from "playwright";

async function testDashboardCharts() {
  console.log("=".repeat(60));
  console.log("PLAYWRIGHT TEST: Dashboard Charts Functionality");
  console.log("=".repeat(60));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const logs = [];

  // Capture console messages - ALWAYS print them
  page.on("console", (msg) => {
    const text = msg.text();
    logs.push({ type: msg.type(), text });
    // Always print all console messages
    console.log(`[BROWSER CONSOLE ${msg.type()}] ${text}`);
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

    // Wait for Socket.IO connection and initial render
    await page.waitForTimeout(3000);

    // Step 2: Check charts section exists
    console.log("\n[STEP 2] Checking charts section...");
    const chartsSection = await page.$(".charts-section");
    console.log("  Charts section exists:", !!chartsSection);

    // Step 3: Check for chart canvases
    console.log("\n[STEP 3] Checking chart canvases...");
    const cpuCanvas = await page.$("#cpuChart");
    const gpuCanvas = await page.$("#gpuChart");
    console.log("  CPU canvas exists:", !!cpuCanvas);
    console.log("  GPU canvas exists:", !!gpuCanvas);

    // Step 4: Check chart tabs
    console.log("\n[STEP 4] Checking chart tabs...");
    const cpuTab = await page.$('[data-chart="cpu"]');
    const gpuTab = await page.$('[data-chart="gpu"]');
    console.log("  CPU tab exists:", !!cpuTab);
    console.log("  GPU tab exists:", !!gpuTab);

    if (cpuTab && gpuTab) {
      // Check which tab is active
      const cpuTabClass = await cpuTab.getAttribute("class");
      const gpuTabClass = await gpuTab.getAttribute("class");
      console.log("  CPU tab class:", cpuTabClass);
      console.log("  GPU tab class:", gpuTabClass);
      console.log("  CPU tab is active:", cpuTabClass.includes("active"));
      console.log("  GPU tab is active:", gpuTabClass.includes("active"));

      // Step 5: Click on GPU tab
      console.log("\n[STEP 5] Clicking GPU tab...");
      await gpuTab.click();
      await page.waitForTimeout(1000);

      // Check if GPU tab is now active
      const gpuTabClassAfter = await gpuTab.getAttribute("class");
      console.log("  GPU tab class after click:", gpuTabClassAfter);
      console.log("  GPU tab is active after click:", gpuTabClassAfter.includes("active"));

      // Check canvas visibility
      const cpuCanvasDisplay = await page.$eval("#cpuChart", (el) => getComputedStyle(el).display);
      const gpuCanvasDisplay = await page.$eval("#gpuChart", (el) => getComputedStyle(el).display);
      console.log("  CPU canvas display:", cpuCanvasDisplay);
      console.log("  GPU canvas display:", gpuCanvasDisplay);

      // Step 6: Click back on CPU tab
      console.log("\n[STEP 6] Clicking CPU tab...");
      await cpuTab.click();
      await page.waitForTimeout(1000);

      const cpuTabClassAfter = await cpuTab.getAttribute("class");
      const cpuCanvasDisplayAfter = await page.$eval(
        "#cpuChart",
        (el) => getComputedStyle(el).display
      );
      console.log("  CPU tab class after click:", cpuTabClassAfter);
      console.log("  CPU tab is active after click:", cpuTabClassAfter.includes("active"));
      console.log("  CPU canvas display after:", cpuCanvasDisplayAfter);
    }

    // Step 7: Check chart wrapper
    console.log("\n[STEP 7] Checking chart wrapper...");
    const chartWrapper = await page.$(".chart-wrapper");
    console.log("  Chart wrapper exists:", !!chartWrapper);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`Charts section exists: ${!!chartsSection}`);
    console.log(`CPU canvas exists: ${!!cpuCanvas}`);
    console.log(`GPU canvas exists: ${!!gpuCanvas}`);
    console.log(`Chart tabs exist: ${!!cpuTab && !!gpuTab}`);
    console.log(`Chart wrapper exists: ${!!chartWrapper}`);
    console.log(`Total page errors: ${errors.length}`);

    const testPassed =
      !!chartsSection && !!cpuCanvas && !!gpuCanvas && !!cpuTab && !!gpuTab && errors.length === 0;

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

testDashboardCharts()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
