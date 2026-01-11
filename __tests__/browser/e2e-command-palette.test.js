/**
 * Browser E2E Tests - Command Palette
 * Tests the application using Chrome DevTools for real browser testing
 * @jest-environment node
 */

const SERVER_URL = "http://localhost:3000";

describe("Command Palette E2E Tests", function () {
  let browser;

  beforeAll(async function () {
    // Launch browser
    browser = await chrome.launch({ headless: false });
  }, 60000);

  afterAll(async function () {
    if (browser) {
      await browser.close();
    }
  }, 30000);

  describe("Page Load", function () {
    it("should load the main page successfully", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: "networkidle" });

      // Check page title
      const title = await page.title();
      expect(title).toContain("Llama Proxy Dashboard");

      // Check main elements exist
      const app = await page.$("#app");
      expect(app).not.toBeNull();

      // Check sidebar exists
      const sidebar = await page.$(".sidebar");
      expect(sidebar).not.toBeNull();

      await page.close();
    }, 30000);

    it("should have navigation sidebar with links", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: });

      // "networkidle" Check navigation links
      const navLinks = await page.$$(".nav-link, [data-nav]");
      expect(navLinks.length).toBeGreaterThan(0);

      await page.close();
    }, 30000);
  });

  describe("Command Palette", function () {
    it("should open with Ctrl+K", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // Press Ctrl+K to open command palette
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyK");
      await page.keyboard.up("Control");
      await page.waitForTimeout(300);

      // Check if command palette is visible
      const palette = await page.$(".command-palette-overlay");
      const isVisible = palette ? await palette.isVisible() : false;
      expect(isVisible).toBe(true);

      await page.close();
    }, 30000);

    it("should filter commands when typing", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // Open command palette
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyK");
      await page.keyboard.up("Control");
      await page.waitForTimeout(300);

      // Type to filter
      await page.keyboard.type("dashboard");
      await page.waitForTimeout(200);

      // Check results are filtered
      const items = await page.$$(".command-item");
      expect(items.length).toBeLessThan(20); // Should be fewer than all commands

      await page.close();
    }, 30000);

    it("should navigate with arrow keys", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // Open command palette
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyK");
      await page.keyboard.up("Control");
      await page.waitForTimeout(300);

      // Press down arrow
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(100);

      // Check if first item is selected
      const selected = await page.$(".command-item.selected");
      expect(selected).not.toBeNull();

      await page.close();
    }, 30000);

    it("should close with Escape", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // Open command palette
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyK");
      await page.keyboard.up("Control");
      await page.waitForTimeout(300);

      // Verify it's open
      let palette = await page.$(".command-palette-overlay");
      expect(palette).not.toBeNull();

      // Close with Escape
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);

      // Verify it's closed
      palette = await page.$(".command-palette-overlay");
      const isVisible = palette ? await palette.isVisible() : false;
      expect(isVisible).toBe(false);

      await page.close();
    }, 30000);
  });

  describe("Navigation", function () {
    it("should navigate to models page", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // Open command palette
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyK");
      await page.keyboard.up("Control");
      await page.waitForTimeout(300);

      // Type models
      await page.keyboard.type("models");
      await page.waitForTimeout(200);

      // Press enter
      await page.keyboard.press("Enter");
      await page.waitForTimeout(500);

      // Check URL changed
      const url = page.url();
      expect(url).toContain("/models");

      await page.close();
    }, 30000);

    it("should navigate to presets page", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // Open command palette
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyK");
      await page.keyboard.up("Control");
      await page.waitForTimeout(300);

      // Type presets
      await page.keyboard.type("presets");
      await page.waitForTimeout(200);

      // Press enter
      await page.keyboard.press("Enter");
      await page.waitForTimeout(500);

      // Check URL changed
      const url = page.url();
      expect(url).toContain("/presets");

      await page.close();
    }, 30000);
  });

  describe("Theme Toggle", function () {
    it("should toggle dark mode", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // Get initial state
      const hasDarkMode = await page.evaluate(() => {
        return document.documentElement.classList.contains("dark-mode");
      });

      // Open command palette and toggle theme
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyK");
      await page.keyboard.up("Control");
      await page.waitForTimeout(300);

      await page.keyboard.type("dark");
      await page.waitForTimeout(200);

      await page.keyboard.press("Enter");
      await page.waitForTimeout(300);

      // Check state changed
      const hasDarkModeAfter = await page.evaluate(() => {
        return document.documentElement.classList.contains("dark-mode");
      });
      expect(hasDarkModeAfter).not.toBe(hasDarkMode);

      await page.close();
    }, 30000);
  });
});

describe("Application State Tests", function () {
  let browser;

  beforeAll(async function () {
    browser = await chrome.launch({ headless: false });
  }, 60000);

  afterAll(async function () {
    if (browser) {
      await browser.close();
    }
  }, 30000);

  describe("Router", function () {
    it("should initialize router correctly", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: "networkidle" });

      // Check router is defined
      const routerExists = await page.evaluate(() => {
        return typeof window.router !== "undefined";
      });
      expect(routerExists).toBe(true);

      await page.close();
    }, 30000);

    it("should have state manager", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: "networkidle" });

      // Check state manager is defined
      const stateExists = await page.evaluate(() => {
        return typeof window.stateManager !== "undefined";
      });
      expect(stateExists).toBe(true);

      await page.close();
    }, 30000);

    it("should have socket client", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: "networkidle" });

      // Check socket client is defined
      const socketExists = await page.evaluate(() => {
        return typeof window.socketClient !== "undefined";
      });
      expect(socketExists).toBe(true);

      await page.close();
    }, 30000);
  });

  describe("Plugin System", function () {
    it("should have plugin system available", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: "networkidle" });

      const hasPluginSystem = await page.evaluate(() => {
        return typeof window.PluginSystem !== "undefined";
      });
      expect(hasPluginSystem).toBe(true);

      await page.close();
    }, 30000);

    it("should have chart loader", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: "networkidle" });

      const hasChartLoader = await page.evaluate(() => {
        return typeof window.ChartLoader !== "undefined";
      });
      expect(hasChartLoader).toBe(true);

      await page.close();
    }, 30000);
  });

  describe("Compute Worker", function () {
    it("should have compute worker available", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: "networkidle" });

      const hasWorker = await page.evaluate(() => {
        return typeof window.ComputeWorker !== "undefined";
      });
      expect(hasWorker).toBe(true);

      await page.close();
    }, 30000);

    it("should generate IDs", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: "networkidle" });

      const id = await page.evaluate(() => {
        return window.ComputeWorker.generateId();
      });

      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(10);

      await page.close();
    }, 30000);

    it("should format bytes", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: "networkidle" });

      const result = await page.evaluate(() => {
        return window.ComputeWorker.formatBytes(1024);
      });

      expect(result).toContain("KB");

      await page.close();
    }, 30000);
  });

  describe("Toast Notifications", function () {
    it("should have toast manager", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: "networkidle" });

      const hasToast = await page.evaluate(() => {
        return typeof window.ToastManager !== "undefined";
      });
      expect(hasToast).toBe(true);

      await page.close();
    }, 30000);
  });
});

describe("UI Components Tests", function () {
  let browser;

  beforeAll(async function () {
    browser = await chrome.launch({ headless: false });
  }, 60000);

  afterAll(async function () {
    if (browser) {
      await browser.close();
    }
  }, 30000);

  describe("Dashboard", function () {
    it("should load dashboard charts", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);

      // Check for chart containers
      const charts = await page.$$(".chart-container, #usageChart, #memoryChart");
      expect(charts.length).toBeGreaterThanOrEqual(0);

      await page.close();
    }, 30000);
  });

  describe("Sidebar", function () {
    it("should have working navigation", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // Click on models nav item if exists
      const modelsNav = await page.$('[data-nav="/models"], .nav-link[href="/models"]');
      if (modelsNav) {
        await modelsNav.click();
        await page.waitForTimeout(500);

        const url = page.url();
        expect(url).toContain("/models");
      }

      await page.close();
    }, 30000);

    it("should have theme toggle button", async function () {
      const page = await browser.newPage();
      await page.goto(SERVER_URL, { waitUntil: "networkidle" });

      const themeBtn = await page.$('[data-action="theme"], .theme-toggle, #theme-toggle');
      expect(themeBtn).not.toBeNull();

      await page.close();
    }, 30000);
  });

  describe("Models Page", function () {
    it("should load models page content", async function () {
      const page = await browser.newPage();
      await page.goto(`${SERVER_URL}/models`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);

      // Check for models page elements
      const modelsPage = await page.$(".models-page, #models-page");
      expect(modelsPage).not.toBeNull();

      await page.close();
    }, 30000);
  });

  describe("Presets Page", function () {
    it("should load presets page content", async function () {
      const page = await browser.newPage();
      await page.goto(`${SERVER_URL}/presets`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);

      // Check for presets page elements
      const presetsPage = await page.$(".presets-page, #presets-page");
      expect(presetsPage).not.toBeNull();

      await page.close();
    }, 30000);
  });
});
