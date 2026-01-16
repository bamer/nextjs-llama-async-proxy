/**
 * Complete Router Start/Stop Test
 */

import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";

async function testRouterStartStop() {
  console.log("=== ROUTER START/STOP TEST ===\n");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  try {
    console.log("1. Loading Dashboard...");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check initial state
    const initial = await page.evaluate(() => ({
      status: window.stateManager?.get?.("llamaServerStatus"),
      badge: document.querySelector(".badge-text")?.textContent?.trim(),
    }));
    console.log(
      `2. Initial state: ${initial.badge} (server: ${initial.status?.processRunning ? "running" : "stopped"})`
    );
    console.log(`   Status: ${initial.status?.status}`);

    // Find the router toggle button (not the hamburger menu)
    const toggleBtn = await page.$('[data-action="toggle"][data-action-type]');
    const btnType = await toggleBtn?.getAttribute("data-action-type");
    console.log(`3. Toggle button type: "${btnType}"`);

    if (btnType === "start") {
      console.log("\n4. Testing START...");

      // Click start
      await toggleBtn.click();
      console.log("   Clicked Start button");

      // Wait for server to start (up to 60 seconds)
      for (let i = 0; i < 60; i++) {
        await page.waitForTimeout(1000);
        const currentStatus = await page.evaluate(() => ({
          status: window.stateManager?.get?.("llamaServerStatus"),
          badge: document.querySelector(".badge-text")?.textContent?.trim(),
        }));

        if (currentStatus.badge === "RUNNING" && currentStatus.status?.processRunning) {
          console.log(`   ✅ Server started after ${i + 1}s`);
          console.log(
            `   Status: ${currentStatus.status.status}, Process: ${currentStatus.status.processRunning}`
          );
          break;
        }

        if (i % 10 === 0 && i > 0) {
          console.log(`   Still waiting... (${i}s)`);
        }
      }

      // Check final start state
      const afterStart = await page.evaluate(() => ({
        status: window.stateManager?.get?.("llamaServerStatus"),
        badge: document.querySelector(".badge-text")?.textContent?.trim(),
        indicator: document.querySelector(".status-indicator")?.className,
      }));
      console.log(`\n5. After start:`);
      console.log(`   Badge: ${afterStart.badge}`);
      console.log(`   Indicator: ${afterStart.indicator}`);
      console.log(`   Status: ${afterStart.status?.status}`);
      console.log(`   Process: ${afterStart.status?.processRunning}`);

      // Now test STOP
      console.log("\n6. Testing STOP...");
      const stopBtn = await page.$('[data-action="toggle"][data-action-type="stop"]');

      if (stopBtn) {
        // Handle the confirm dialog
        page.once("dialog", async (dialog) => {
          console.log(`   Dialog: "${dialog.message()}"`);
          await dialog.accept();
        });

        await stopBtn.click();
        console.log("   Clicked Stop button");

        // Wait for server to stop (up to 30 seconds)
        for (let i = 0; i < 30; i++) {
          await page.waitForTimeout(1000);
          const currentStatus = await page.evaluate(() => ({
            status: window.stateManager?.get?.("llamaServerStatus"),
            badge: document.querySelector(".badge-text")?.textContent?.trim(),
          }));

          if (currentStatus.badge === "STOPPED" && !currentStatus.status?.processRunning) {
            console.log(`   ✅ Server stopped after ${i + 1}s`);
            break;
          }

          if (i % 10 === 0 && i > 0) {
            console.log(`   Still waiting... (${i}s)`);
          }
        }

        // Check final stop state
        const afterStop = await page.evaluate(() => ({
          status: windowManager?.get?.("llamaServerStatus"),
          badge: document.querySelector(".badge-text")?.textContent?.trim(),
          indicator: document.querySelector(".status-indicator")?.className,
        }));
        console.log(`\n7. After stop:`);
        console.log(`   Badge: ${afterStop.badge}`);
        console.log(`   Indicator: ${afterStop.indicator}`);
        console.log(`   Status: ${afterStop.status?.status}`);
        console.log(`   Process: ${afterStop.status?.processRunning}`);
      } else {
        console.log("   Stop button not found!");
      }
    } else {
      console.log("\n4. Router is already running, testing STOP...");
    }

    console.log("\n=== TEST COMPLETE ===");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await browser.close();
  }
}

testRouterStartStop().catch(console.error);
