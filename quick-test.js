/**
 * Quick verification test
 */

import { chromium } from "playwright";

(async () => {
  console.log("🚀 Quick verification test...\n");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];

  // Listen for console errors
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!text.includes("favicon")) {
        errors.push(text);
      }
    }
  });

  try {
    console.log("📄 Loading Dashboard...");
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 10000 });
    await page.waitForTimeout(2000);

    // Check for key elements
    const appExists = (await page.$("#app")) !== null;
    const contentExists = (await page.$("#page-content, .main-content, .page-content")) !== null;

    console.log(`✅ Page loaded`);
    console.log(`📊 App element: ${appExists}`);
    console.log(`📊 Content element: ${contentExists}`);

    // Filter Component errors
    const componentErrors = errors.filter(
      (e) => e.includes("Component") || e.includes("already been declared")
    );

    if (componentErrors.length > 0) {
      console.log(`\n❌ Component Errors Found (${componentErrors.length}):`);
      componentErrors.forEach((e) => console.log(`   - ${e.substring(0, 150)}...`));
    } else {
      console.log(`\n✅ No Component errors found!`);
    }

    // Take screenshot
    await page.screenshot({
      path: "/home/bamer/nextjs-llama-async-proxy/screenshots/dashboard-verification.png",
      fullPage: true,
    });
    console.log(`\n📸 Screenshot saved: dashboard-verification.png`);

    // Overall status
    const criticalErrors = componentErrors.length;
    console.log(
      `\n${criticalErrors === 0 ? "✅" : "❌"} VERIFICATION RESULT: ${criticalErrors === 0 ? "PASSED" : "FAILED"}`
    );
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }

  await browser.close();
})();
