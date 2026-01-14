/**
 * Simple Navigation Test
 * Tests if all pages load without errors
 */

import { chromium } from "playwright";

(async () => {
  console.log("🚀 SIMPLE NAVIGATION TEST\n");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const results = [];

  const pages = [
    { path: "/", name: "Dashboard" },
    { path: "/models", name: "Models" },
    { path: "/presets", name: "Presets" },
    { path: "/settings", name: "Settings" },
    { path: "/logs", name: "Logs" },
    { path: "/monitoring", name: "Monitoring" },
  ];

  for (const testPage of pages) {
    console.log(`📄 Testing: ${testPage.name}...`);

    try {
      await page.goto(`http://localhost:3000${testPage.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 5000,
      });

      await page.waitForTimeout(1000);

      // Check for app element
      const hasApp = (await page.$("#app")) !== null;

      // Check for content element
      const hasContent = await page.evaluate(() => {
        return document.body.innerText.length > 100; // Check if page has content
      });

      results.push({
        name: testPage.name,
        path: testPage.path,
        loaded: true,
        hasApp: hasApp,
        hasContent: hasContent,
        status: hasApp && hasContent ? "✅ PASS" : "⚠️ PARTIAL",
      });

      console.log(
        `   ${hasApp && hasContent ? "✅" : "⚠️"} ${testPage.name}: App=${hasApp}, Content=${hasContent ? "Yes" : "No"}`
      );
    } catch (error) {
      results.push({
        name: testPage.name,
        path: testPage.path,
        loaded: false,
        error: error.message,
        status: "❌ FAIL",
      });
      console.log(`   ❌ ${testPage.name}: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 RESULTS SUMMARY");
  console.log("=".repeat(50));

  const passed = results.filter((r) => r.status === "✅ PASS").length;
  const partial = results.filter((r) => r.status === "⚠️ PARTIAL").length;
  const failed = results.filter((r) => r.status === "❌ FAIL").length;

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`⚠️  Partial: ${partial}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\n🎯 Overall: ${failed === 0 ? "GOOD" : "NEEDS WORK"}`);

  await browser.close();
})();
