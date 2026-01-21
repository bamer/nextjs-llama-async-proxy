#!/usr/bin/env node

/**
 * GPU Detection Diagnostic Script
 * Run: node test-gpu-detection.js
 *
 * This script tests GPU detection without starting the full server
 * Helps diagnose if GPUs are detected on your system
 */

import { detectAndCollectGpus } from "./server/services/gpu-detector.js";
import { buildBroadcastData } from "./server/services/gpu-monitor.js";

async function testDetection() {
  console.log("=".repeat(60));
  console.log("GPU DETECTION DIAGNOSTIC TEST");
  console.log("=".repeat(60));

  console.log("\n1. Testing GPU detection...\n");

  try {
    const gpus = await detectAndCollectGpus();

    console.log(`\n✅ Detection completed. Found ${gpus.length} GPU(s)\n`);

    if (gpus.length === 0) {
      console.warn("⚠️  WARNING: No GPUs detected!");
      console.log("\nDebug info:");
      console.log("- Check /sys/class/drm/ exists");
      console.log("- Run: ls -la /sys/class/drm/");
      console.log("- Run: lspci | grep -E 'VGA|3D|Display'");
      console.log("");
      return;
    }

    // Display detected GPUs
    gpus.forEach((gpu, i) => {
      console.log(`GPU ${i + 1}:`);
      console.log(`  Device ID: ${gpu.deviceId}`);
      console.log(`  Name: ${gpu.name}`);
      console.log(`  Vendor: ${gpu.vendor}`);
      console.log(
        `  VRAM: ${gpu.vramTotalMiB} MiB (${gpu.vramTotalBytes} bytes)`
      );
      console.log(`  Type: ${gpu.isIntegrated ? "Integrated" : "Discrete"}`);
      console.log(`  Driver: ${gpu.driverVersion || "Unknown"}`);
      console.log(`  Metrics:`);
      console.log(
        `    - Utilization: ${gpu.metrics?.utilizationPercent || 0}%`
      );
      console.log(
        `    - Memory: ${gpu.metrics?.memoryUsedMiB || 0}/${gpu.metrics?.memoryTotalMiB || 0} MiB`
      );
      console.log(
        `    - Temperature: ${gpu.metrics?.temperatureCelsius || "N/A"}°C`
      );
      console.log(`    - Power: ${gpu.metrics?.powerDrawWatts || "N/A"} W`);
      console.log("");
    });

    console.log("\n2. Testing broadcast data format...\n");

    const broadcastData = buildBroadcastData(gpus);

    console.log(`✅ Broadcast data created`);
    console.log(`  - Type: ${broadcastData.type}`);
    console.log(`  - List count: ${broadcastData.data?.list?.length || 0}`);
    console.log(`  - Total count: ${broadcastData.data?.count || 0}`);
    console.log(
      `  - Total VRAM: ${broadcastData.data?.memoryTotal || 0} bytes`
    );
    console.log(`  - Avg Usage: ${broadcastData.data?.usage || 0}%`);

    console.log("\n3. Checking broadcast data structure...\n");

    if (!broadcastData.data) {
      console.error("❌ ERROR: broadcastData.data is missing!");
      console.log("Full structure:", broadcastData);
      return;
    }

    if (!Array.isArray(broadcastData.data.list)) {
      console.error("❌ ERROR: broadcastData.data.list is not an array!");
      console.log("Full structure:", broadcastData.data);
      return;
    }

    console.log("✅ Broadcast data structure is valid");

    // Check each GPU object
    broadcastData.data.list.forEach((gpu, i) => {
      console.log(`\nGPU ${i + 1} in broadcast:`);
      console.log(`  ✓ deviceId: ${gpu.deviceId}`);
      console.log(`  ✓ name: ${gpu.name}`);
      console.log(`  ✓ vendor: ${gpu.vendor}`);
      console.log(`  ✓ vramTotalMiB: ${gpu.vramTotalMiB}`);
      console.log(`  ✓ vramTotalBytes: ${gpu.vramTotalBytes}`);
      console.log(`  ✓ isIntegrated: ${gpu.isIntegrated}`);
      console.log(
        `  ✓ metrics.memoryTotalMiB: ${gpu.metrics?.memoryTotalMiB || 0}`
      );

      if (!gpu.name || gpu.name === "Unknown") {
        console.warn(`  ⚠️  WARNING: GPU name is '${gpu.name}'`);
      }

      if (!gpu.vramTotalMiB || gpu.vramTotalMiB === 0) {
        console.warn(`  ⚠️  WARNING: VRAM is ${gpu.vramTotalMiB} MiB`);
      }
    });

    console.log("\n" + "=".repeat(60));
    console.log("✅ DIAGNOSTIC COMPLETE - All checks passed");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ ERROR during detection:", error.message);
    console.error("\nStack trace:", error.stack);
    process.exit(1);
  }
}

// Run the test
testDetection().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
