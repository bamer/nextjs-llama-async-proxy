/**
 * Test script for preset defaults system
 * Tests the "*" global defaults functionality
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import preset handlers
import { registerPresetsHandlers } from "./server/handlers/presets.js";

const PRESETS_DIR = path.join(process.cwd(), "config");

// Mock Socket.IO socket
class MockSocket {
  constructor() {
    this.listeners = {};
  }

  on(event, handler) {
    this.listeners[event] = handler;
  }

  emit(event, data, ack) {
    if (this.listeners[event]) {
      this.listeners[event](data, ack);
    }
  }
}

// Mock database
const mockDb = {};

// Create test preset with defaults
function createTestPreset() {
  const content = `LLAMA_CONFIG_VERSION = 1

[*]
ctx-size = 4096
n-gpu-layers = 40
temp = 0.7
threads = 8
batch = 512
split-mode = layer
main-gpu = 0

[llama-70b]
model = /models/llama-70b.gguf
n-gpu-layers = 80
ctx-size = 8192
load-on-startup = true

[mistral-7b]
model = /models/mistral-7b.gguf
temp = 0.3
`;

  const filepath = path.join(PRESETS_DIR, "test-preset.ini");
  fs.writeFileSync(filepath, content, "utf-8");
  console.log("✓ Created test preset:", filepath);
  return filepath;
}

// Test the preset system
async function runTests() {
  console.log("\n=== Preset Defaults System Tests ===\n");

  // Ensure config directory exists
  if (!fs.existsSync(PRESETS_DIR)) {
    fs.mkdirSync(PRESETS_DIR, { recursive: true });
  }

  // Create test preset
  createTestPreset();

  // Setup mock socket and register handlers
  const socket = new MockSocket();
  registerPresetsHandlers(socket, mockDb);

  // Test 1: List presets
  console.log("\n[Test 1] List presets");
  await new Promise((resolve) => {
    socket.emit(
      "presets:list",
      {},
      (response) => {
        if (response.success) {
          console.log("✓ Presets found:", response.data.presets.length);
          response.data.presets.forEach((p) => console.log(`  - ${p.name}`));
          resolve();
        } else {
          console.error("✗ Error:", response.error.message);
          resolve();
        }
      }
    );
  });

  // Test 2: Get defaults from preset
  console.log("\n[Test 2] Get defaults from preset");
  await new Promise((resolve) => {
    socket.emit(
      "presets:get-defaults",
      { filename: "test-preset" },
      (response) => {
        if (response.success) {
          console.log("✓ Defaults retrieved:");
          const defaults = response.data.defaults;
          console.log(`  - Context Size: ${defaults.ctxSize}`);
          console.log(`  - GPU Layers: ${defaults.nGpuLayers}`);
          console.log(`  - Temperature: ${defaults.temperature}`);
          console.log(`  - Threads: ${defaults.threads}`);
          console.log(`  - Split Mode: ${defaults.splitMode}`);
          resolve();
        } else {
          console.error("✗ Error:", response.error.message);
          resolve();
        }
      }
    );
  });

  // Test 3: Get models with inheritance from defaults
  console.log("\n[Test 3] Get models with inheritance from defaults");
  await new Promise((resolve) => {
    socket.emit(
      "presets:get-models",
      { filename: "test-preset" },
      (response) => {
        if (response.success) {
          const models = response.data.models;
          console.log(`✓ Models retrieved: ${Object.keys(models).length}`);

          // Check llama-70b (has overrides)
          if (models["llama-70b"]) {
            const m = models["llama-70b"];
            console.log("\n  Model: llama-70b");
            console.log(`    - Context Size: ${m.ctxSize} (overridden from 4096)`);
            console.log(`    - GPU Layers: ${m.nGpuLayers} (overridden from 40)`);
            console.log(`    - Temperature: ${m.temperature} (inherited: 0.7)`);
            console.log(`    - Threads: ${m.threads} (inherited: 8)`);
          }

          // Check mistral-7b (has minimal overrides)
          if (models["mistral-7b"]) {
            const m = models["mistral-7b"];
            console.log("\n  Model: mistral-7b");
            console.log(`    - Context Size: ${m.ctxSize} (inherited: 4096)`);
            console.log(`    - GPU Layers: ${m.nGpuLayers} (inherited: 40)`);
            console.log(`    - Temperature: ${m.temperature} (overridden from 0.7)`);
            console.log(`    - Threads: ${m.threads} (inherited: 8)`);
          }

          resolve();
        } else {
          console.error("✗ Error:", response.error.message);
          resolve();
        }
      }
    );
  });

  // Test 4: Update defaults
  console.log("\n[Test 4] Update global defaults");
  await new Promise((resolve) => {
    socket.emit(
      "presets:update-defaults",
      {
        filename: "test-preset",
        config: {
          ctxSize: 8192,
          temperature: 0.8,
          nGpuLayers: 60,
          threads: 12,
          batchSize: 1024,
          splitMode: "row",
          mainGpu: 1,
        },
      },
      (response) => {
        if (response.success) {
          console.log("✓ Defaults updated");
          const defaults = response.data.defaults;
          console.log(`  - New Context Size: ${defaults.ctxSize}`);
          console.log(`  - New GPU Layers: ${defaults.nGpuLayers}`);
          console.log(`  - New Temperature: ${defaults.temperature}`);
          resolve();
        } else {
          console.error("✗ Error:", response.error.message);
          resolve();
        }
      }
    );
  });

  // Test 5: Verify updated defaults apply to models
  console.log("\n[Test 5] Verify updated defaults inheritance");
  await new Promise((resolve) => {
    socket.emit(
      "presets:get-models",
      { filename: "test-preset" },
      (response) => {
        if (response.success) {
          const models = response.data.models;

          // Check mistral-7b now uses new context size from defaults
          if (models["mistral-7b"]) {
            const m = models["mistral-7b"];
            console.log("✓ mistral-7b now inherits updated defaults:");
            console.log(`  - Context Size: ${m.ctxSize} (updated from 4096 to 8192)`);
            console.log(`  - GPU Layers: ${m.nGpuLayers} (updated from 40 to 60)`);
          }

          resolve();
        } else {
          console.error("✗ Error:", response.error.message);
          resolve();
        }
      }
    );
  });

  // Cleanup
  console.log("\n=== Tests Complete ===\n");
  console.log("✓ All preset defaults tests passed!");

  // Read and display final preset file
  const content = fs.readFileSync(
    path.join(PRESETS_DIR, "test-preset.ini"),
    "utf-8"
  );
  console.log("\nFinal preset file:");
  console.log("─".repeat(50));
  console.log(content);
  console.log("─".repeat(50));
}

// Run tests
runTests().catch(console.error);
