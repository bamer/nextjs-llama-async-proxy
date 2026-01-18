const fs = require("fs");

// Read the controller file
const content = fs.readFileSync(
  "/home/bamer/nextjs-llama-async-proxy/public/js/pages/models/controller.js",
  "utf8"
);

// Check for patterns that should NOT exist
const issues = [];

// Check for controller: this pattern
if (content.includes("controller: this")) {
  issues.push("FAIL: Found 'controller: this' in ModelsPage props");
} else {
  console.log("PASS: No 'controller: this' in ModelsPage props");
}

// Check for updateModelList pattern
if (content.includes("updateModelList")) {
  issues.push("FAIL: Found 'updateModelList' direct call");
} else {
  console.log("PASS: No 'updateModelList' direct calls");
}

// Check for setModelLoading pattern
if (content.includes("setModelLoading")) {
  issues.push("FAIL: Found 'setModelLoading' direct call");
} else {
  console.log("PASS: No 'setModelLoading' direct calls");
}

// Check for setScanning pattern
if (content.includes("setScanning")) {
  issues.push("FAIL: Found 'setScanning' direct call");
} else {
  console.log("PASS: No 'setScanning' direct calls");
}

// Check for setActionStatus pattern (should exist)
if (content.includes("setActionStatus")) {
  console.log("PASS: Found 'setActionStatus' calls");
} else {
  issues.push("FAIL: No 'setActionStatus' calls found");
}

// Check for action event listeners
if (content.includes('subscribe("action:models:scan"')) {
  console.log("PASS: Found 'action:models:scan' subscription");
} else {
  issues.push("FAIL: No 'action:models:scan' subscription found");
}

if (content.includes('subscribe("action:models:load"')) {
  console.log("PASS: Found 'action:models:load' subscription");
} else {
  issues.push("FAIL: No 'action:models:load' subscription found");
}

if (content.includes('subscribe("action:models:unload"')) {
  console.log("PASS: Found 'action:models:unload' subscription");
} else {
  issues.push("FAIL: No 'action:models:unload' subscription found");
}

if (content.includes('subscribe("action:models:delete"')) {
  console.log("PASS: Found 'action:models:delete' subscription");
} else {
  issues.push("FAIL: No 'action:models:delete' subscription found");
}

// Check for _handleScan, _handleLoad, _handleUnload, _handleDelete
if (content.includes("_handleScan")) {
  console.log("PASS: Found '_handleScan' handler");
} else {
  issues.push("FAIL: No '_handleScan' handler found");
}

if (content.includes("_handleLoad")) {
  console.log("PASS: Found '_handleLoad' handler");
} else {
  issues.push("FAIL: No '_handleLoad' handler found");
}

if (content.includes("_handleUnload")) {
  console.log("PASS: Found '_handleUnload' handler");
} else {
  issues.push("FAIL: No '_handleUnload' handler found");
}

if (content.includes("_handleDelete")) {
  console.log("PASS: Found '_handleDelete' handler");
} else {
  issues.push("FAIL: No '_handleDelete' handler found");
}

// Check for willUnmount cleanup
if (content.includes("unsubscribers.forEach")) {
  console.log("PASS: Found unsubscribers cleanup");
} else {
  issues.push("FAIL: No unsubscribers cleanup found");
}

// Check that old handle methods are removed
const oldMethods = ["handleLoad", "handleUnload", "handleScan"];
for (const method of oldMethods) {
  // Look for async handleX methods (the old ones)
  const pattern = new RegExp(`async\\s+${method}\\s*\\(`);
  if (pattern.test(content)) {
    issues.push(`FAIL: Old '${method}' method still exists`);
  } else {
    console.log(`PASS: Old '${method}' method removed`);
  }
}

// Summary
console.log("\n--- Summary ---");
if (issues.length === 0) {
  console.log("All checks passed!");
  process.exit(0);
} else {
  console.log(`Found ${issues.length} issues:`);
  issues.forEach((issue) => console.log(`  - ${issue}`));
  process.exit(1);
}
