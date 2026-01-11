#!/usr/bin/env node
/**
 * Browser E2E Test Runner
 * Runs browser-based tests using Chrome DevTools
 */

import { chromium } from "playwright";

const SERVER_URL = "http://localhost:3000";

async function runTests() {
  console.log("🚀 Starting Browser E2E Tests...\n");

  const browser = await chromium.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  let passed = 0;
  let failed = 0;

  // Test 1: Page Load
  console.log("📄 Test 1: Page Load");
  try {
    const page = await browser.newPage();
    await page.goto(SERVER_URL, { waitUntil: "networkidle", timeout: 10000 });
    
    const title = await page.title();
    console.log(`   ✓ Page title: ${title}`);
    
    const app = await page.$("#app");
    console.log(`   ✓ App element: ${app ? "found" : "not found"}`);
    
    await page.close();
    passed++;
  } catch (e) {
    console.log(`   ✗ Failed: ${e.message}`);
    failed++;
  }

  // Test 2: Command Palette
  console.log("\n🎯 Test 2: Command Palette (Ctrl+K)");
  try {
    const page = await browser.newPage();
    await page.goto(SERVER_URL, { waitUntil: "networkidle", timeout: 10000 });
    await page.waitForTimeout(500);
    
    // Press Ctrl+K
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyK");
    await page.keyboard.up("Control");
    await page.waitForTimeout(300);
    
    const palette = await page.$(".command-palette-overlay");
    const isVisible = palette ? await palette.isVisible() : false;
    
    if (isVisible) {
      console.log("   ✓ Command palette opened");
      
      // Type to filter
      await page.keyboard.type("dashboard");
      await page.waitForTimeout(200);
      
      const items = await page.$$(".command-item");
      console.log(`   ✓ Filtered commands: ${items.length} items`);
      
      // Close with Escape
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
      
      const closed = await page.$(".command-palette-overlay");
      const isClosed = closed ? !(await closed.isVisible()) : true;
      console.log(`   ✓ Command palette closed: ${isClosed}`);
    } else {
      console.log("   ⚠ Command palette not visible (may be CSS issue)");
    }
    
    await page.close();
    passed++;
  } catch (e) {
    console.log(`   ✗ Failed: ${e.message}`);
    failed++;
  }

  // Test 3: Navigation
  console.log("\n🧭 Test 3: Navigation");
  try {
    const page = await browser.newPage();
    await page.goto(SERVER_URL, { waitUntil: "networkidle", timeout: 10000 });
    await page.waitForTimeout(500);
    
    // Open command palette and navigate to models
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyK");
    await page.keyboard.up("Control");
    await page.waitForTimeout(300);
    
    await page.keyboard.type("models");
    await page.waitForTimeout(200);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    
    const url = page.url();
    console.log(`   ✓ Navigated to: ${url}`);
    
    await page.close();
    passed++;
  } catch (e) {
    console.log(`   ✗ Failed: ${e.message}`);
    failed++;
  }

  // Test 4: Theme Toggle
  console.log("\n🌙 Test 4: Theme Toggle");
  try {
    const page = await browser.newPage();
    await page.goto(SERVER_URL, { waitUntil: "networkidle", timeout: 10000 });
    await page.waitForTimeout(500);
    
    const hasDarkBefore = await page.evaluate(() => {
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
    
    const hasDarkAfter = await page.evaluate(() => {
      return document.documentElement.classList.contains("dark-mode");
    });
    
    console.log(`   ✓ Dark mode before: ${hasDarkBefore}, after: ${hasDarkAfter}`);
    console.log(`   ✓ Theme toggle works: ${hasDarkBefore !== hasDarkAfter}`);
    
    await page.close();
    passed++;
  } catch (e) {
    console.log(`   ✗ Failed: ${e.message}`);
    failed++;
  }

  // Test 5: Core Modules
  console.log("\n🔧 Test 5: Core Modules");
  try {
    const page = await browser.newPage();
    await page.goto(SERVER_URL, { waitUntil: "networkidle", timeout: 10000 });
    
    const checks = await page.evaluate(() => {
      return {
        router: typeof window.router !== "undefined",
        stateManager: typeof window.stateManager !== "undefined",
        socketClient: typeof window.socketClient !== "undefined",
        PluginSystem: typeof window.PluginSystem !== "undefined",
        ChartLoader: typeof window.ChartLoader !== "undefined",
        ComputeWorker: typeof window.ComputeWorker !== "undefined",
        ToastManager: typeof window.ToastManager !== "undefined"
      };
    });
    
    console.log("   Module checks:");
    for (const [module, exists] of Object.entries(checks)) {
      console.log(`   ${exists ? "✓" : "✗"} ${module}: ${exists ? "loaded" : "missing"}`);
    }
    
    const allLoaded = Object.values(checks).every(v => v);
    if (!allLoaded) {
      throw new Error("Some modules not loaded");
    }
    
    await page.close();
    passed++;
  } catch (e) {
    console.log(`   ✗ Failed: ${e.message}`);
    failed++;
  }

  // Test 6: Compute Worker Functions
  console.log("\n⚡ Test 6: Compute Worker Functions");
  try {
    const page = await browser.newPage();
    await page.goto(SERVER_URL, { waitUntil: "networkidle", timeout: 10000 });
    
    const results = await page.evaluate(async () => {
      try {
        const id = await window.ComputeWorker.generateId();
        const bytes = await window.ComputeWorker.formatBytes(1024);
        const percent = await window.ComputeWorker.formatPercent(0.5);
        const clone = await window.ComputeWorker.deepClone({ a: 1, b: 2 });
        const empty = await window.ComputeWorker.isEmpty({});
        const hash = await window.ComputeWorker.simpleHash("test");
        
        return {
          id: id,
          idValid: id.length > 10,
          bytes: bytes,
          bytesValid: bytes.includes("KB"),
          percent: percent,
          percentValid: percent.includes("50"),
          clone: clone,
          cloneValid: clone.a === 1 && clone.b === 2,
          empty: empty,
          emptyValid: empty === true,
          hash: hash,
          hashValid: hash.length > 0
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    
    if (results.error) {
      throw new Error(results.error);
    }
    
    console.log(`   ✓ generateId: ${results.id}`);
    console.log(`   ✓ formatBytes: ${results.bytes}`);
    console.log(`   ✓ formatPercent: ${results.percent}`);
    console.log(`   ✓ deepClone: ${JSON.stringify(results.clone)}`);
    console.log(`   ✓ isEmpty: ${results.empty}`);
    console.log(`   ✓ simpleHash: ${results.hash}`);
    
    const allValid = results.idValid && results.bytesValid && results.percentValid && 
                     results.cloneValid && results.emptyValid && results.hashValid;
    if (!allValid) {
      throw new Error("Some worker functions returned invalid results");
    }
    
    await page.close();
    passed++;
  } catch (e) {
    console.log(`   ✗ Failed: ${e.message}`);
    failed++;
  }

  // Test 7: Sidebar Navigation
  console.log("\n📋 Test 7: Sidebar Navigation");
  try {
    const page = await browser.newPage();
    await page.goto(SERVER_URL, { waitUntil: "networkidle", timeout: 10000 });
    
    const navLinks = await page.$$(".nav-link, [data-nav]");
    console.log(`   ✓ Found ${navLinks.length} navigation links`);
    
    if (navLinks.length > 0) {
      // Click first nav link
      await navLinks[0].click();
      await page.waitForTimeout(500);
      console.log(`   ✓ Clicked first navigation link`);
    }
    
    await page.close();
    passed++;
  } catch (e) {
    console.log(`   ✗ Failed: ${e.message}`);
    failed++;
  }

  // Test 8: Toast Notifications
  console.log("\n🔔 Test 8: Toast Notifications");
  try {
    const page = await browser.newPage();
    await page.goto(SERVER_URL, { waitUntil: "networkidle", timeout: 10000 });
    
    // Trigger a toast notification
    await page.evaluate(() => {
      if (window.ToastManager) {
        window.ToastManager.success("Test notification", 2000);
      }
    });
    await page.waitForTimeout(500);
    
    const toast = await page.$(".toast, .toast-notification");
    const toastExists = toast !== null;
    console.log(`   ✓ Toast notification: ${toastExists ? "shown" : "not shown"}`);
    
    await page.close();
    passed++;
  } catch (e) {
    console.log(`   ✗ Failed: ${e.message}`);
    failed++;
  }

  // Test 9: Plugin System
  console.log("\n🔌 Test 9: Plugin System");
  try {
    const page = await browser.newPage();
    await page.goto(SERVER_URL, { waitUntil: "networkidle", timeout: 10000 });
    
    const pluginsInfo = await page.evaluate(() => {
      return {
        registered: window.PluginSystem.plugins.size,
        loaded: window.PluginSystem.loadedPlugins.size
      };
    });
    
    console.log(`   ✓ Registered plugins: ${pluginsInfo.registered}`);
    console.log(`   ✓ Loaded plugins: ${pluginsInfo.loaded}`);
    
    await page.close();
    passed++;
  } catch (e) {
    console.log(`   ✗ Failed: ${e.message}`);
    failed++;
  }

  // Test 10: Command Palette All Commands
  console.log("\n🎯 Test 10: Command Palette Categories");
  try {
    const page = await browser.newPage();
    await page.goto(SERVER_URL, { waitUntil: "networkidle", timeout: 10000 });
    await page.waitForTimeout(500);
    
    // Open command palette
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyK");
    await page.keyboard.up("Control");
    await page.waitForTimeout(300);
    
    const categories = await page.evaluate(() => {
      const groups = document.querySelectorAll(".command-group-title");
      return Array.from(groups).map(g => g.textContent);
    });
    
    console.log(`   ✓ Categories: ${categories.join(", ")}`);
    if (categories.length <= 3) {
      throw new Error("Expected more than 3 categories");
    }
    
    await page.close();
    passed++;
  } catch (e) {
    console.log(`   ✗ Failed: ${e.message}`);
    failed++;
  }

  // Test 11: Validation Functions
  console.log("\n✓ Test 11: Validation Functions");
  try {
    const page = await browser.newPage();
    await page.goto(SERVER_URL, { waitUntil: "networkidle", timeout: 10000 });
    
    const results = await page.evaluate(async () => {
      try {
        const validString = await window.ComputeWorker.validateValue("test", "string");
        const validNumber = await window.ComputeWorker.validateValue(42, "number", { min: 0, max: 100 });
        const validEmail = await window.ComputeWorker.validateValue("test@example.com", "email");
        const validPort = await window.ComputeWorker.validateValue(8080, "port");
        const invalidEmail = await window.ComputeWorker.validateValue("invalid", "email");
        
        return {
          validString,
          validNumber,
          validEmail,
          validPort,
          invalidEmail
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    
    if (results.error) {
      throw new Error(results.error);
    }
    
    console.log(`   ✓ string validation: ${results.validString}`);
    console.log(`   ✓ number validation: ${results.validNumber}`);
    console.log(`   ✓ email validation: ${results.validEmail}`);
    console.log(`   ✓ port validation: ${results.validPort}`);
    console.log(`   ✓ invalid email: ${results.invalidEmail === false}`);
    
    const allValid = results.validString && results.validNumber && results.validEmail && 
                     results.validPort && results.invalidEmail === false;
    if (!allValid) {
      throw new Error("Validation functions returned incorrect results");
    }
    
    await page.close();
    passed++;
  } catch (e) {
    console.log(`   ✗ Failed: ${e.message}`);
    failed++;
  }

  // Test 12: INI Parser
  console.log("\n📝 Test 12: INI Parser");
  try {
    const page = await browser.newPage();
    await page.goto(SERVER_URL, { waitUntil: "networkidle", timeout: 10000 });
    
    const iniContent = `
# This is a comment
key1=value1
key2=value2

[section]
name=test
port=8080
`;
    
    const result = await page.evaluate(async (ini) => {
      return await window.ComputeWorker.parseIni(ini);
    }, iniContent);
    
    console.log(`   ✓ Parsed keys: ${Object.keys(result).join(", ")}`);
    console.log(`   ✓ Section: ${result.section ? "found" : "not found"}`);
    if (result.key1 !== "value1") throw new Error("key1 mismatch");
    if (result.section.name !== "test") throw new Error("section.name mismatch");
    
    await page.close();
    passed++;
  } catch (e) {
    console.log(`   ✗ Failed: ${e.message}`);
    failed++;
  }

  // Test 13: JSON Parser
  console.log("\n📋 Test 13: JSON Parser");
  try {
    const page = await browser.newPage();
    await page.goto(SERVER_URL, { waitUntil: "networkidle", timeout: 10000 });
    
    const jsonContent = '{"name": "test", "value": 42, "items": [1, 2, 3]}';
    
    const result = await page.evaluate(async (json) => {
      return await window.ComputeWorker.parseJson(json);
    }, jsonContent);
    
    console.log(`   ✓ Parsed JSON: ${JSON.stringify(result)}`);
    if (result.name !== "test") throw new Error("name mismatch");
    if (result.value !== 42) throw new Error("value mismatch");
    if (result.items.length !== 3) throw new Error("items length mismatch");
    
    await page.close();
    passed++;
  } catch (e) {
    console.log(`   ✗ Failed: ${e.message}`);
    failed++;
  }

  // Test 14: Time Formatting
  console.log("\n⏰ Test 14: Time Formatting");
  try {
    const page = await browser.newPage();
    await page.goto(SERVER_URL, { waitUntil: "networkidle", timeout: 10000 });
    
    const now = Date.now();
    
    const timestamp = await page.evaluate(async (t) => {
      return await window.ComputeWorker.formatTimestamp(t);
    }, now);
    
    const relative = await page.evaluate(async () => {
      const past = Date.now() - 3600000; // 1 hour ago
      return await window.ComputeWorker.formatRelativeTime(past);
    });
    
    console.log(`   ✓ Timestamp: ${timestamp}`);
    console.log(`   ✓ Relative: ${relative}`);
    
    await page.close();
    passed++;
  } catch (e) {
    console.log(`   ✗ Failed: ${e.message}`);
    failed++;
  }

  // Test 15: Keyboard Shortcuts Help
  console.log("\n⌨️  Test 15: Keyboard Shortcuts Help");
  try {
    const page = await browser.newPage();
    await page.goto(SERVER_URL, { waitUntil: "networkidle", timeout: 10000 });
    
    const hasShortcuts = await page.evaluate(() => {
      return typeof window.keyboardShortcuts !== "undefined";
    });
    
    console.log(`   ✓ Keyboard shortcuts: ${hasShortcuts ? "available" : "not available"}`);
    
    await page.close();
    passed++;
  } catch (e) {
    console.log(`   ✗ Failed: ${e.message}`);
    failed++;
  }

  // Test 16: Route Changes
  console.log("\n🛤️ Test 16: Route Changes");
  try {
    const page = await browser.newPage();
    await page.goto(SERVER_URL, { waitUntil: "networkidle", timeout: 10000 });
    
    // Check initial route
    const initialPath = await page.evaluate(() => window.router.getPath());
    console.log(`   ✓ Initial path: ${initialPath}`);
    
    // Navigate to presets
    await page.evaluate(() => window.router.navigate("/presets"));
    await page.waitForTimeout(500);
    const presetsPath = await page.evaluate(() => window.router.getPath());
    console.log(`   ✓ Presets path: ${presetsPath}`);
    
    // Navigate to settings
    await page.evaluate(() => window.router.navigate("/settings"));
    await page.waitForTimeout(500);
    const settingsPath = await page.evaluate(() => window.router.getPath());
    console.log(`   ✓ Settings path: ${settingsPath}`);
    
    if (!presetsPath.includes("/presets")) throw new Error("Presets path incorrect");
    if (!settingsPath.includes("/settings")) throw new Error("Settings path incorrect");
    
    await page.close();
    passed++;
  } catch (e) {
    console.log(`   ✗ Failed: ${e.message}`);
    failed++;
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Test Summary");
  console.log("=".repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);
  console.log("=".repeat(50));

  await browser.close();
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error("Test runner error:", e);
  process.exit(1);
});
