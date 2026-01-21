import { test, expect } from '@playwright/test';

// Test configuration
const baseURL = 'http://localhost:3000';

// Test cases for visual regression, responsiveness, accessibility, and theme awareness
test.describe('UI Consistency and Responsiveness', () => {
  test.beforeAll(async () => {
    // Ensure the app is running
    await Promise.resolve(); // Placeholder for any setup
  });

  // Test visual regression and responsiveness
  test('Dashboard UI consistency and responsiveness', async ({ page }) => {
    await page.goto(baseURL + '/dashboard');

    // Check if the page loads successfully
    await expect(page).toHaveTitle(/Dashboard/);

    // Test responsiveness by checking layout at different viewports
    await test.step('Mobile layout', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('.sidebar')).toHaveCSS('transform', 'translateX(-100%)'); // Sidebar should be collapsed
      await expect(page.locator('.card')).toHaveCSS('grid-template-columns', '1fr'); // Cards should stack vertically
    });

    await test.step('Tablet layout', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('.sidebar')).toHaveCSS('transform', 'translateX(0)'); // Sidebar should be visible
      await expect(page.locator('.card')).toHaveCSS('grid-template-columns', 'repeat(2, 1fr)'); // Cards should be in 2 columns
    });

    await test.step('Desktop layout', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('.sidebar')).toHaveCSS('transform', 'translateX(0)'); // Sidebar should be visible
      await expect(page.locator('.card')).toHaveCSS('grid-template-columns', 'repeat(4, 1fr)'); // Cards should be in 4 columns
    });
  });

  // Test theme awareness (dark/light mode)
  test('Theme awareness (dark mode)', async ({ page }) => {
    await page.goto(baseURL + '/dashboard');
    
    // Enable dark mode by adding the 'dark' class to the HTML element
    await page.addInitScript(() => {
      document.documentElement.classList.add('dark');
    });
    
    // Reload the page to apply dark mode
    await page.reload();
    
    // Verify dark mode is applied
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(17, 24, 39)'); // Dark background
    await expect(page.locator('.card')).toHaveCSS('background-color', 'rgb(31, 41, 55)'); // Dark card background
  });

  // Test accessibility (focus states)
  test('Accessibility: Focus states', async ({ page }) => {
    await page.goto(baseURL + '/dashboard');
    
    // Focus on a button and verify the focus ring is visible
    const button = page.locator('button');
    await button.focus();
    await expect(button).toHaveCSS('outline', '2px solid rgb(99 102 241)'); // Focus ring color
  });
});

// Additional test cases for other pages
const pages = ['/dashboard', '/monitoring', '/models'];

pages.forEach((pagePath) => {
  test(`UI consistency for ${pagePath}`, async ({ page }) => {
    await page.goto(baseURL + pagePath);
    
    // Check for standardized Tailwind classes
    await expect(page.locator('.bg-primary')).toBeVisible();
    await expect(page.locator('.text-foreground')).toBeVisible();
    await expect(page.locator('.shadow-sm')).toBeVisible();
  });
});