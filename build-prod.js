#!/usr/bin/env node

/**
 * Build script for production deployment
 * Optimizes the application for production by:
 * - Removing debug code
 * - Minifying scripts
 * - Optimizing assets
 */

const fs = require("fs");
const path = require("path");

console.log("🏗️  Building for production...");

// Function to minify debug code in production
function createProductionVersion(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // Remove debug console.log statements (but keep errors and warnings)
  content = content.replace(/console\.log\([^)]*DEBUG[^)]*\);?/g, "");
  content = content.replace(/console\.log\([^)]*TRACE[^)]*\);?/g, "");
  content = content.replace(/console\.log\([^)]*TIMING[^)]*\);?/g, "");
  content = content.replace(/console\.log\([^)]*SOCKET[^)]*\);?/g, "");

  // Disable debug system in production
  content = content.replace(
    /\/\/ Auto-enable in development[\s\S]*?console\.log.*?\);/,
    `// Production mode: debug system disabled
  window.DEBUG_SYSTEM.tracer.disable();
  window.DEBUG_SYSTEM.socket.disable();
  window.DEBUG_SYSTEM.logging.enabled = false;
  console.log('[PROD] Debug system disabled for production');`
  );

  return content;
}

// Create production index.html
function createProductionIndex() {
  let indexContent = fs.readFileSync("public/index.html", "utf8");

  // Add production meta tag
  indexContent = indexContent.replace(
    "<title>Llama Proxy Dashboard</title>",
    '<title>Llama Proxy Dashboard</title>\n    <meta name="env" content="production" />'
  );

  // Remove debug scripts in production (uncomment to enable)
  /*
  indexContent = indexContent.replace(
    '    <script defer src="/js/utils/debug-tools.js"></script>\n',
    ''
  );
  indexContent = indexContent.replace(
    '    <script defer src="/js/utils/integration-tests.js"></script>\n',
    ''
  );
  indexContent = indexContent.replace(
    '    <script defer src="/js/utils/debug-dashboard.js"></script>\n',
    ''
  );
  */

  return indexContent;
}

try {
  // Create production versions
  const debugToolsProd = createProductionVersion("public/js/utils/debug-tools.js");
  const indexProd = createProductionIndex();

  // Write production files
  fs.writeFileSync("public/js/utils/debug-tools.prod.js", debugToolsProd);
  fs.writeFileSync("public/index.prod.html", indexProd);

  console.log("✅ Production build completed!");
  console.log("📁 Files created:");
  console.log("   - public/js/utils/debug-tools.prod.js");
  console.log("   - public/index.prod.html");
  console.log("");
  console.log("🚀 To use production build:");
  console.log("   cp public/index.prod.html public/index.html");
  console.log("   cp public/js/utils/debug-tools.prod.js public/js/utils/debug-tools.js");
} catch (error) {
  console.error("❌ Build failed:", error);
  process.exit(1);
}
