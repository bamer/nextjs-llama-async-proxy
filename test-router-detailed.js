/**
 * Detailed Debug Test for Router Button
 */

import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";

async function debugRouterButton() {
  console.log("=== DETAILED ROUTER BUTTON DEBUG ===\n");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Capture ALL console messages
  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === "log" && text.includes("[DEBUG]")) {
      console.log(`[BROWSER] ${text}`);
    }
  });

  try {
    console.log("1. Loading Dashboard...");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 30000 });

    // Wait for initial load and socket connection
    await page.waitForTimeout(2000);

    // Step 2: Check initial state
    console.log("\n2. Checking initial state...");
    const initialState = await page.evaluate(() => {
      return {
        llamaServerStatus: window.stateManager?.get?.("llamaServerStatus"),
        llamaServerMetrics: window.stateManager?.get?.("llamaServerMetrics"),
        routerStatus: window.stateManager?.get?.("routerStatus"),
      };
    });
    console.log("Initial state:", JSON.stringify(initialState, null, 2));

    // Step 3: Get UI state
    console.log("\n3. Getting UI state...");
    const uiState = await page.evaluate(() => {
      const statusBadge = document.querySelector(".badge-text");
      const statusIndicator = document.querySelector(".status-indicator");
      const toggleBtn = document.querySelector('[data-action="toggle"]');

      // Check the actual statusIndicator class
      const indicatorClass = statusIndicator?.className || "";
      const isRunningClass = indicatorClass.includes("running");
      const isStoppedClass = indicatorClass.includes("stopped");
      const isLoadingClass = indicatorClass.includes("loading");

      return {
        badgeText: statusBadge?.textContent?.trim(),
        indicatorClass,
        isRunning: isRunningClass,
        isStopped: isStoppedClass,
        isLoading: isLoadingClass,
        toggleText: toggleBtn?.textContent?.trim(),
        toggleType: toggleBtn?.getAttribute("data-action-type"),
      };
    });
    console.log("UI state:", JSON.stringify(uiState, null, 2));

    // Step 4: Check props passed to LlamaRouterCard
    console.log("\n4. Checking LlamaRouterCard props...");
    const cardProps = await page.evaluate(() => {
      const card = document.querySelector(".llama-router-status-card");
      if (card?._component) {
        const comp = card._component;
        return {
          hasProps: !!comp.props,
          status: comp.props?.status,
          routerStatus: comp.props?.routerStatus,
          metrics: comp.props?.metrics,
        };
      }
      return { error: "No _component found" };
    });
    console.log("Card props:", JSON.stringify(cardProps, null, 2));

    // Step 5: Test click
    console.log("\n5. Testing button click...");
    const toggleBtn = await page.$('[data-action="toggle"][data-action-type]');
    if (toggleBtn) {
      const btnType = await toggleBtn.getAttribute("data-action-type");
      console.log(`   Found toggle button with type: "${btnType}"`);

      // Check button state before click
      const btnStateBefore = await page.evaluate(() => {
        const btn = document.querySelector('[data-action="toggle"]');
        return {
          text: btn?.textContent?.trim(),
          disabled: btn?.disabled,
        };
      });
      console.log("   Button before click:", btnStateBefore);

      // Click and wait
      await toggleBtn.click();
      await page.waitForTimeout(5000); // Wait for any async updates

      // Check state after click
      const btnStateAfter = await page.evaluate(() => {
        const btn = document.querySelector('[data-action="toggle"]');
        const badge = document.querySelector(".badge-text");
        const indicator = document.querySelector(".status-indicator");
        return {
          text: btn?.textContent?.trim(),
          disabled: btn?.disabled,
          badgeText: badge?.textContent?.trim(),
          indicatorClass: indicator?.className,
          llamaStatus: window.stateManager?.get?.("llamaServerStatus"),
        };
      });
      console.log("   Button after click:", JSON.stringify(btnStateAfter, null, 2));
    } else {
      console.log("   ❌ Toggle button not found!");
    }

    // Step 6: Final state
    console.log("\n6. Final state check...");
    const finalState = await page.evaluate(() => {
      return {
        llamaServerStatus: window.stateManager?.get?.("llamaServerStatus"),
        ui: {
          badgeText: document.querySelector(".badge-text")?.textContent?.trim(),
          indicatorClass: document.querySelector(".status-indicator")?.className,
        },
      };
    });
    console.log("Final state:", JSON.stringify(finalState, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await browser.close();
  }
}

debugRouterButton().catch(console.error);
