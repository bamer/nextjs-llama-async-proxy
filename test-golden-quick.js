/**
 * Quick Golden Rule Test
 * Simplified version: Open browser, navigate pages, take screenshots
 */

import { chromium } from "playwright";

(async () => {
  console.log("🚀 GOLDEN RULE QUICK TEST\n");

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const pages = [
    { path: "/", name: "Dashboard" },
    { path: "/models", name: "Models" },
    { path: "/presets", name: "Presets" },
    { path: "/settings", name: "Settings" },
    { path: "/logs", name: "Logs" },
    { path: "/monitoring", name: "Monitoring" },
  ];

  console.log("📱 Opening browser...\n");

  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  console.log("🧪 Testing all pages...\n");

  for (const testPage of pages) {
    console.log(`📄 ${testPage.name} (${testPage.path})`);

    try {
      await page.goto(`http://localhost:3000${testPage.path}`, {
        waitUntil: "networkidle",
        timeout: 10000,
      });
      await page.waitForTimeout(1500);

      // Check elements
      const appExists = (await page.$("#app")) !== null;
      const hasContent =
        (await page.$(
          ".main-content, #page-content, .page-content, .dashboard-page, .models-page, .presets-page, .settings-page, .logs-page, .monitoring-page"
        )) !== null;

      // Click buttons on page
      const buttons = await page.$$("button");
      let clickCount = 0;
      for (const btn of buttons.slice(0, 5)) {
        // Limit to 5 buttons per page
        try {
          await btn.click().catch(() => {});
          clickCount++;
        } catch (e) {}
      }

      // Click links on page
      const links = await page.$$("a");
      for (const link of links.slice(0, 3)) {
        // Limit to 3 links per page
        try {
          await link.click().catch(() => {});
          clickCount++;
        } catch (e) {}
      }

      // Take screenshot
      const screenshotName = `golden-${testPage.name.toLowerCase()}.png`;
      await page.screenshot({
        path: `/home/bamer/nextjs-llama-async-proxy/screenshots/${screenshotName}`,
        fullPage: true,
      });

      console.log(`   ✅ Elements: App=${appExists}, Content=${hasContent}`);
      console.log(`   🖱️  Clicks: ${clickCount}`);
      console.log(`   📸 Screenshot: ${screenshotName}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log("\n✅ Golden Rule Test Complete!");
  console.log("📸 All screenshots saved to /home/bamer/nextjs-llama-async-proxy/screenshots/");

  await browser.close();
})();
