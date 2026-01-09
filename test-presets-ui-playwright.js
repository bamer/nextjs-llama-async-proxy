const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  console.log("[DEBUG] Navigating to presets page...");

  try {
    // Navigate to presets page
    await page.goto("http://localhost:3000/presets", { waitUntil: "networkidle" });

    // Wait for page to load
    await page.waitForTimeout(3000);

    console.log("[DEBUG] Page loaded. Taking initial screenshot...");
    await page.screenshot({ path: "test-screenshots/01-presets-initial.png" });

    // Check for presets list
    const presetsList = await page.waitForSelector(".presets-list", { timeout: 10000 });
    console.log("[DEBUG] Presets list found");

    // Count presets
    const presetItems = await page.$$(".preset-item");
    console.log(`[DEBUG] Found ${presetItems.length} presets`);

    if (presetItems.length > 0) {
      // Click on first preset (likely 'default')
      const firstPreset = await page.$(".preset-item");
      await firstPreset.click();
      console.log("[DEBUG] Clicked on first preset");

      await page.waitForTimeout(2000);

      console.log("[DEBUG] Taking screenshot after selecting preset...");
      await page.screenshot({ path: "test-screenshots/02-preset-selected.png", fullPage: true });

      // Check if Global Defaults section exists
      const defaultsSection = await page.$(".defaults-section");
      if (defaultsSection) {
        console.log("[DEBUG] Defaults section found");

        // Check for "defaults-grid" (new UI) vs old params list
        const defaultsGrid = await page.$(".defaults-grid");
        const paramsList = await page.$(".params-list");

        if (defaultsGrid) {
          console.log("[DEBUG] NEW UI: defaults-grid found - showing all parameters");
        } else if (paramsList) {
          console.log("[DEBUG] OLD UI: params-list found - showing only set parameters");
        } else {
          console.log("[DEBUG] No parameters display found");
        }

        // Check if parameters are populated
        const paramInputs = await page.$$(".param-input");
        console.log(`[DEBUG] Number of param inputs: ${paramInputs.length}`);

        if (paramInputs.length > 0) {
          console.log("[DEBUG] WARNING: Default preset has parameters preset!");
          for (let i = 0; i < Math.min(5, paramInputs.length); i++) {
            const input = paramInputs[i];
            const value = await input.inputValue();
            const name = await input.getAttribute("data-param");
            console.log(`[DEBUG]   Parameter ${i + 1}: ${name} = ${value}`);
          }
        } else {
          console.log("[DEBUG] Default preset is empty (correct)");
        }

        await page.screenshot({ path: "test-screenshots/03-defaults-section.png", fullPage: true });
      } else {
        console.log("[DEBUG] Defaults section not found");
      }

      // Check for Groups section
      const groupsSection = await page.$(".groups-section");
      if (groupsSection) {
        console.log("[DEBUG] Groups section found");
        const groupItems = await page.$$(".group-section");
        console.log(`[DEBUG] Found ${groupItems.length} groups`);

        if (groupItems.length > 0) {
          // Expand first group
          const firstGroup = groupItems[0];
          await firstGroup.click();
          await page.waitForTimeout(1000);

          console.log("[DEBUG] Taking screenshot of expanded group...");
          await page.screenshot({ path: "test-screenshots/04-group-expanded.png", fullPage: true });

          // Check for models in group
          const modelsInGroup = await page.$$(".models-list-compact .model-list-item");
          console.log(`[DEBUG] Models in group: ${modelsInGroup.length}`);

          // Try to click on a model to check if editing is blocked
          if (modelsInGroup.length > 0) {
            const firstModelInGroup = modelsInGroup[0];
            await firstModelInGroup.click();
            await page.waitForTimeout(1000);

            console.log("[DEBUG] Taking screenshot after clicking model in group...");
            await page.screenshot({
              path: "test-screenshots/05-model-in-group-clicked.png",
              fullPage: true,
            });

            // Check for notification about editing blocked
            const notification = await page.$("#notifications .notification");
            if (notification) {
              const notificationText = await notification.textContent();
              console.log(`[DEBUG] Notification: ${notificationText}`);
            }
          }
        }
      }

      // Check for "New Preset" button
      const newPresetBtn = await page.waitForSelector("[data-action=new-preset]", {
        timeout: 5000,
      });
      console.log("[DEBUG] New Preset button found");

      // Try to create a new preset
      console.log("[DEBUG] Clicking New Preset button...");
      await newPresetBtn.click();
      await page.waitForTimeout(500);

      // Check for dialog/alert
      const dialog = await page.$(".modal");
      if (dialog) {
        console.log("[DEBUG] Modal dialog found for new preset");
        await page.screenshot({ path: "test-screenshots/06-new-preset-modal.png", fullPage: true });
      } else {
        console.log("[DEBUG] Using browser prompt for new preset");
      }

      // Test with smaller viewport (mobile)
      console.log("[DEBUG] Testing responsive layout...");
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "test-screenshots/07-mobile-view.png", fullPage: true });

      // Reset to desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(1000);
    } else {
      console.log("[DEBUG] No presets found - showing empty state");
      await page.screenshot({ path: "test-screenshots/08-empty-state.png", fullPage: true });
    }

    console.log("[DEBUG] Testing complete");
  } catch (error) {
    console.error("[DEBUG] Error during test:", error);
    await page.screenshot({ path: "test-screenshots/error.png", fullPage: true });
  } finally {
    await browser.close();
  }
})();
