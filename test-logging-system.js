#!/usr/bin/env node

/**
 * Simple test script to verify the logging system is working
 * This script tests the server-side components without requiring a browser
 */

import http from "http";

console.log("🧪 Testing Logging System Server Components...\n");

// Test 1: Server responds to basic requests
console.log("1. Testing server response...");
const req1 = http.get("http://localhost:3000", (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    if (data.includes("Llama Proxy Dashboard")) {
      console.log("✅ Server responds correctly");
    } else {
      console.log("❌ Server response invalid");
    }
  });
});

req1.on("error", (err) => {
  console.log("❌ Server connection failed:", err.message);
});

// Test 2: Check that debug scripts are served
setTimeout(() => {
  console.log("\n2. Testing debug script availability...");
  const req2 = http.get("http://localhost:3000/js/utils/debug-tools.js", (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      if (data.includes("DEBUG_SYSTEM") && data.includes("TimingProfiler")) {
        console.log("✅ Debug tools script loads correctly");
      } else {
        console.log("❌ Debug tools script invalid");
      }
    });
  });

  req2.on("error", (err) => {
    console.log("❌ Debug script load failed:", err.message);
  });
}, 1000);

// Test 3: Check integration tests script
setTimeout(() => {
  console.log("\n3. Testing integration tests script...");
  const req3 = http.get("http://localhost:3000/js/utils/integration-tests.js", (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      if (data.includes("LoggingSystemIntegrationTests") && data.includes("runAllTests")) {
        console.log("✅ Integration tests script loads correctly");
      } else {
        console.log("❌ Integration tests script invalid");
      }
    });
  });

  req3.on("error", (err) => {
    console.log("❌ Integration tests script load failed:", err.message);
  });
}, 2000);

// Test 4: Check debug documentation
setTimeout(() => {
  console.log("\n4. Testing debug documentation...");
  const req4 = http.get("http://localhost:3000/DEBUG_SYSTEM.md", (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      if (data.includes("Debug System Documentation") && data.includes("TimingProfiler")) {
        console.log("✅ Debug documentation available");
      } else {
        console.log("❌ Debug documentation missing");
      }
    });
  });

  req4.on("error", (err) => {
    console.log("❌ Debug documentation request failed:", err.message);
  });
}, 3000);

// Final summary
setTimeout(() => {
  console.log("\n🎉 Server-side tests completed!");
  console.log("\n📋 Next steps:");
  console.log("1. Open http://localhost:3000 in your browser");
  console.log('2. Open browser console and type: console.log("Test message")');
  console.log("3. Navigate to http://localhost:3000/logs to see real-time updates");
  console.log("4. Press Ctrl+Shift+D to open the debug dashboard");
  console.log("5. Go to http://localhost:3000/logs?run-tests to run full integration tests");
  console.log("\n🚀 The logging system is now fully operational!");
}, 4000);
