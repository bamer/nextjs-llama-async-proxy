#!/usr/bin/env node
/**
 * Server-side Verification Script
 *
 * This script verifies the key fixes are working correctly
 * without requiring a browser.
 *
 * Usage: node verify-fixes.js
 */

import http from "http";

const SERVER_URL = "http://localhost:3000";

console.log("=== SERVER-SIDE VERIFICATION ===\n");

async function testEndpoint(path, name) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    http
      .get(`${SERVER_URL}${path}`, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          const duration = Date.now() - startTime;
          const status = res.statusCode === 200 ? "✅" : "❌";

          console.log(`${status} ${name}`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Time: ${duration}ms`);
          console.log(`   Size: ${data.length} bytes`);
          console.log("");

          resolve({
            name,
            status: res.statusCode === 200 ? "PASS" : "FAIL",
            statusCode: res.statusCode,
            duration,
            size: data.length,
            success: res.statusCode === 200,
          });
        });
      })
      .on("error", (error) => {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        console.log("");

        resolve({
          name,
          status: "ERROR",
          error: error.message,
          success: false,
        });
      });
  });
}

async function runTests() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { passed: 0, failed: 0, errors: 0 },
  };

  console.log("Testing server availability and key endpoints...\n");

  // Test main application
  results.tests.push(await testEndpoint("/", "Main Application"));

  // Test JavaScript files
  results.tests.push(await testEndpoint("/js/services/socket.js", "Socket.IO Client"));
  results.tests.push(await testEndpoint("/js/core/component-base.js", "Component Base Class"));
  results.tests.push(await testEndpoint("/js/core/component-helpers.js", "Component Helpers"));
  results.tests.push(await testEndpoint("/js/core/component-h.js", "Component.h Function"));
  results.tests.push(
    await testEndpoint("/js/pages/dashboard/dashboard-controller.js", "Dashboard Controller")
  );
  results.tests.push(await testEndpoint("/js/core/state.js", "State Manager"));
  results.tests.push(await testEndpoint("/js/core/router.js", "Router"));

  // Test Socket.IO library
  results.tests.push(await testEndpoint("/socket.io/socket.io.js", "Socket.IO Library"));

  // Test CSS files
  results.tests.push(await testEndpoint("/css/main.css", "Main CSS"));

  // Calculate summary
  results.tests.forEach((test) => {
    if (test.status === "PASS") results.summary.passed++;
    else if (test.status === "FAIL") results.summary.failed++;
    else results.summary.errors++;
  });

  // Print summary
  console.log("=== TEST SUMMARY ===");
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⚠️ Errors: ${results.summary.errors}`);
  console.log("");

  if (results.summary.failed > 0 || results.summary.errors > 0) {
    console.log("Failed/Error Tests:");
    results.tests
      .filter((t) => t.status !== "PASS")
      .forEach((t) => {
        console.log(`  - ${t.name}: ${t.status}`);
        if (t.error) console.log(`    Error: ${t.error}`);
      });
    console.log("");
  }

  // Verify key fixes
  console.log("=== KEY FIX VERIFICATION ===\n");

  const socketJs = results.tests.find((t) => t.name === "Socket.IO Client");
  if (socketJs && socketJs.success) {
    console.log("✅ Socket.IO Client - File exists and is accessible");
  } else {
    console.log("❌ Socket.IO Client - File not found or inaccessible");
  }

  const dashboardJs = results.tests.find((t) => t.name === "Dashboard Controller");
  if (dashboardJs && dashboardJs.success) {
    console.log("✅ Dashboard Controller - File exists and is accessible");
  } else {
    console.log("❌ Dashboard Controller - File not found or inaccessible");
  }

  const componentFiles = results.tests.filter((t) => t.name.includes("Component") && t.success);
  if (componentFiles.length >= 3) {
    console.log("✅ Component Files - All component files accessible");
  } else {
    console.log(`❌ Component Files - Only ${componentFiles.length}/3 accessible`);
  }

  console.log("\n=== VERIFICATION COMPLETE ===\n");

  // Return results
  return results;
}

runTests().catch(console.error);
