/**
 * Browser Integration Test Script - Models Page Scan Test
 */

import { chromium } from "playwright";

async function testModelsScan() {
  console.log("=".repeat(60));
  console.log("PLAYWRIGHT TEST: Models Page Scan Functionality");
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
    // Only log debug messages
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
    // Step 1: Navigate to models page
    console.log("\n[STEP 1] Navigating to Models page...");
    await page.goto("http://localhost:3000/models", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    console.log("[STEP 1] Page loaded");

    // Wait for Socket.IO connection
    await page.waitForTimeout(2000);

    // Check if models table exists
    const tableExists = await page.$(".models-table");
    console.log("[STEP 1] Models table exists:", !!tableExists);

    // Count initial rows
    const initialRows = await page.$$eval(".models-table tbody tr", (rows) => rows.length);
    console.log("[STEP 1] Initial row count:", initialRows);

    // Step 2: Click scan button
    console.log("\n[STEP 2] Clicking 'Scan Filesystem' button...");
    const scanButton = await page.$('[data-action="scan"]');
    if (!scanButton) {
      throw new Error("Scan button not found!");
    }
    await scanButton.click();
    console.log("[STEP 2] Scan button clicked");

    // Step 3: Wait for scan to complete
    console.log("\n[STEP 3] Waiting for scan to complete...");
    await page.waitForTimeout(5000);

    // Check notifications
    const notifications = await page.$$("#notifications > div");
    console.log("[STEP 3] Notifications count:", notifications.length);
    for (const notif of notifications) {
      const text = await notif.textContent();
      console.log("[STEP 3] Notification:", text);
    }

    // Step 4: Check for updated data
    console.log("\n[STEP 4] Checking for updated data...");
    const finalRows = await page.$$eval(".models-table tbody tr", (rows) => rows.length);
    console.log("[STEP 4] Final row count:", finalRows);

    // Get first row data
    if (finalRows > 0) {
      const cells = await page.$$eval(".models-table tbody tr:first-child td", (cells) =>
        cells.map((c) => c.textContent?.trim())
      );
      console.log("[STEP 4] First model row:");
      console.log("  Name:", cells[0]);
      console.log("  Status:", cells[1]);
      console.log("  Arch:", cells[2]);
      console.log("  Params:", cells[3]);
      console.log("  Quant:", cells[4]);
      console.log("  Ctx:", cells[5]);
      console.log("  Embed:", cells[6]);
      console.log("  Blocks:", cells[7]);
      console.log("  Heads:", cells[8]);
      console.log("  Size:", cells[9]);
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`Initial rows: ${initialRows}`);
    console.log(`Final rows: ${finalRows}`);
    console.log(`Errors: ${errors.length}`);

    // Check for key success/failure indicators
    const scanSuccess = logs.some((l) => l.text.includes("SUCCESS") && l.text.includes("scanModels"));
    const scanError = logs.some((l) => l.text.includes("ERROR") && l.text.includes("scanModels"));
    const modelsRefreshed = logs.some((l) => l.text.includes("refreshModels") && l.text.includes("complete"));

    console.log("\nKey indicators:");
    console.log(`  Scan success: ${scanSuccess}`);
    console.log(`  Scan error: ${scanError}`);
    console.log(`  Models refreshed: ${modelsRefreshed}`);

    if (errors.length > 0) {
      console.log("\nErrors:");
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    console.log("\n" + (errors.length === 0 && scanSuccess ? "✓ TEST PASSED" : "✗ TEST NEEDS INVESTIGATION"));

  } catch (error) {
    console.error("\n[TEST ERROR]", error.message);
    errors.push(error.message);
  } finally {
    await browser.close();
    console.log("\n" + "=".repeat(60));
    console.log("TEST COMPLETE");
    console.log("=".repeat(60));
  }

  return errors.length === 0;
}

testModelsScan()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
