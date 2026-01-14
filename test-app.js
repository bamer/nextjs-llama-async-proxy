import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages = [];
  const errors = [];

  page.on("console", (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text(), location: msg.location() });
    if (msg.type() === "error") {
      errors.push({ message: msg.text(), location: msg.location() });
    }
  });

  page.on("pageerror", (error) => {
    errors.push({ message: error.message, stack: error.stack });
  });

  try {
    console.log("Navigating to http://localhost:3000...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 10000 });

    console.log("Page loaded successfully!");
    console.log("Page title:", await page.title());

    // Wait a bit for any async operations
    await page.waitForTimeout(3000);

    console.log("\n=== Console Errors with Location ===");
    errors.forEach((err) => {
      console.log("ERROR:", err.message);
      if (err.location) {
        console.log("Location:", JSON.stringify(err.location));
      }
      if (err.stack) {
        console.log("Stack:", err.stack);
      }
    });

    if (errors.length === 0) {
      console.log("No errors detected!");
    }
  } catch (e) {
    console.error("Test failed:", e.message);
  } finally {
    await browser.close();
  }
})();
