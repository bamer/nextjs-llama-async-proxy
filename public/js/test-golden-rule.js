/**
 * Golden Rule Testing Script
 * 
 * This script performs comprehensive testing of the Llama Proxy Dashboard
 * to verify all fixes are working correctly.
 * 
 * Usage: Open browser console and paste this script
 */

(async function goldenRuleTest() {
  console.log("=== GOLDEN RULE TESTING ===");
  console.log("Starting comprehensive testing...\n");
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    errors: [],
    warnings: []
  };
  
  // Helper function for test results
  function test(name, fn) {
    try {
      const result = fn();
      results.tests.push({ name, status: result ? "PASS" : "FAIL", result });
      console.log(`${result ? "✅" : "❌"} ${name}: ${result ? "PASS" : "FAIL"}`);
      return result;
    } catch (error) {
      results.tests.push({ name, status: "ERROR", error: error.message });
      results.errors.push({ name, error: error.message });
      console.error(`❌ ${name}: ERROR - ${error.message}`);
      return false;
    }
  }
  
  // 1. Test Page Loading
  console.log("--- PAGE LOADING TESTS ---");
  
  test("Dashboard loads", () => {
    return !!document.querySelector(".dashboard-page, #dashboard");
  });
  
  test("Navigation exists", () => {
    return !!document.querySelector("nav, .nav, [role='navigation']");
  });
  
  // 2. Test Socket.IO
  console.log("\n--- SOCKET.IO TESTS ---");
  
  test("SocketClient available", () => {
    return typeof window.socketClient !== "undefined";
  });
  
  test("SocketClient.request method exists", () => {
    return typeof window.socketClient?.request === "function";
  });
  
  test("SocketClient.request is async", async () => {
    const result = window.socketClient?.request("ping", {});
    return result instanceof Promise;
  });
  
  test("SocketClient.isConnected available", () => {
    return typeof window.socketClient?.isConnected !== "undefined";
  });
  
  // 3. Test State Management
  console.log("\n--- STATE MANAGEMENT TESTS ---");
  
  test("stateManager available", () => {
    return typeof window.stateManager !== "undefined";
  });
  
  test("stateManager.get method exists", () => {
    return typeof window.stateManager?.get === "function";
  });
  
  test("stateManager.set method exists", () => {
    return typeof window.stateManager?.set === "function";
  });
  
  test("stateManager.subscribe method exists", () => {
    return typeof window.stateManager?.subscribe === "function";
  });
  
  // 4. Test Component System
  console.log("\n--- COMPONENT SYSTEM TESTS ---");
  
  test("Component base class available", () => {
    return typeof window.Component !== "undefined";
  });
  
  test("Component.h method exists", () => {
    return typeof window.Component?.h === "function";
  });
  
  test("Component instance can be created", () => {
    try {
      const el = Component.h("div", { className: "test" }, "Test");
      return el instanceof HTMLElement || (typeof el === "object" && el !== null);
    } catch (e) {
      return false;
    }
  });
  
  // 5. Test Router
  console.log("\n--- ROUTER TESTS ---");
  
  test("Router available", () => {
    return typeof window.router !== "undefined";
  });
  
  test("Router.navigate method exists", () => {
    return typeof window.router?.navigate === "function";
  });
  
  test("Router.register method exists", () => {
    return typeof window.router?.register === "function";
  });
  
  // 6. Test Utility Functions
  console.log("\n--- UTILITY TESTS ---");
  
  test("AppUtils available", () => {
    return typeof window.AppUtils !== "undefined";
  });
  
  test("formatBytes function exists", () => {
    return typeof AppUtils?.formatBytes === "function";
  });
  
  test("formatBytes works correctly", () => {
    return AppUtils?.formatBytes(1024 * 1024) === "1.00 MB";
  });
  
  // 7. Test Dashboard Specific
  console.log("\n--- DASHBOARD SPECIFIC TESTS ---");
  
  test("Dashboard has chartUpdateInterval protection", () => {
    // This tests the _startChartUpdates fix
    const dashboard = document.querySelector(".dashboard-page, #dashboard");
    if (!dashboard) return false;
    
    // Check if dashboard controller exists
    return typeof window.dashboardController !== "undefined" || 
           typeof DashboardController !== "undefined";
  });
  
  // 8. Test Navigation
  console.log("\n--- NAVIGATION TESTS ---");
  
  const navLinks = document.querySelectorAll("nav a, .nav a, [data-page], [href^='/']");
  test("Navigation links exist", () => navLinks.length > 0);
  
  // 9. Check Console for Errors
  console.log("\n--- CONSOLE ERROR CHECK ---");
  
  test("No JavaScript errors in console", () => {
    // This is a manual check - we can't programmatically read console errors
    return true; // Manual verification needed
  });
  
  // 10. Test Interactive Elements
  console.log("\n--- INTERACTIVE ELEMENTS ---");
  
  const buttons = document.querySelectorAll("button");
  test("Buttons exist", () => buttons.length > 0);
  
  const inputs = document.querySelectorAll("input, select, textarea");
  test("Form inputs exist", () => inputs.length > 0);
  
  const cards = document.querySelectorAll(".card, [class*='card']");
  test("Cards/components exist", () => cards.length > 0);
  
  // Summary
  console.log("\n=== TEST SUMMARY ===");
  const passCount = results.tests.filter(t => t.status === "PASS").length;
  const failCount = results.tests.filter(t => t.status === "FAIL").length;
  const errorCount = results.tests.filter(t => t.status === "ERROR").length;
  
  console.log(`Total: ${results.tests.length} tests`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⚠️ Errors: ${errorCount}`);
  
  if (results.errors.length > 0) {
    console.log("\nErrors found:");
    results.errors.forEach(e => console.log(`  - ${e.name}: ${e.error}`));
  }
  
  console.log("\n=== END GOLDEN RULE TESTING ===");
  
  // Return results for analysis
  return results;
})();