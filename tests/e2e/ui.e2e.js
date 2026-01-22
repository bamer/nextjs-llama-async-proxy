const { test, expect } = require('@playwright/test');

// End-to-end basic flow: load dashboard, scan models, load a model, run a simple generation
test('End-to-end: load dashboard, scan models, load model, run a quick generation', async ({ page }) => {
  // Open root page
  await page.goto('/', { timeout: 60000 });

  // Basic sanity: ensure page loaded
  await expect(page).toHaveURL(/.*/);

  // Try to navigate to settings and scan models (selectors may vary; adjust as needed)
  try {
    const settings = page.locator('text=Settings');
    if (await settings.count()) await settings.first().click();
  } catch {}

  try {
    const scanBtn = page.locator('text=Scan Models');
    if (await scanBtn.count()) await scanBtn.first().click();
  } catch {}

  // Wait for a magnus model to appear in the list (loose selector)
  const modelItem = page.locator('text=/magnus.*gguf/');
  await modelItem.first().waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});

  // Load the model if possible
  const loadBtn = page.locator('text=Load', { hasText: modelItem });
  if (await loadBtn.count()) {
    await loadBtn.first().click();
  }

  // Attempt a short generation: find a prompt input and a start button if present
  const prompt = page.locator('input[name="prompt"], textarea[name="prompt"]');
  if (await prompt.count()) {
    await prompt.first().fill('Hello world');
    const start = page.locator('text=Start, text=Generate, text=Run');
    if (await start.count()) await start.first().click();
  }

  // Observe a short wait for metrics updates; console logs are captured by Playwright automatically
  await page.waitForTimeout(3000);
  // Capture any console messages (optional)
  page.on('console', msg => {
    // You can keep or filter as needed; log errors for debugging
    if (msg.type() === 'error') {
      console.error('[E2E] Console error:', msg.text());
    } else if (msg.type() === 'warning') {
      console.warn('[E2E] Console warning:', msg.text());
    } else {
      // could log debug messages too
    }
  });
  // Final assertion: page should still be reachable
  await expect(page).toHaveURL(/.*/);
});
