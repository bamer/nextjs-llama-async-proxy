const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];

  page.on("pageerror", (err) => errors.push(err.message));

  try {
    await page.goto("http://localhost:3000/presets", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    const routerCard = await page.locator(".router-card").first();
    const routerCardCount = await page.locator(".router-card").count();
    const statusBadge = await page.locator(".status-badge").first();

    console.log("=== TEST RESULTS ===");
    console.log("Router Card count:", routerCardCount);
    console.log("Router Card visible:", await routerCard.isVisible());
    console.log("Status Badge exists:", (await statusBadge.count()) > 0);

    if ((await statusBadge.count()) > 0) {
      console.log("Status text:", await statusBadge.textContent());
    }

    // Check presets page specific elements
    const routerCardContainer = await page.locator("#router-card").count();
    console.log("Router Card Container (#router-card):", routerCardContainer);

    console.log("\n=== PAGE ERRORS ===");
    console.log("Page errors:", errors.length);
    errors.forEach((e) => console.log(" -", e));
  } catch (err) {
    console.error("Test error:", err.message);
  }

  await browser.close();
})();
