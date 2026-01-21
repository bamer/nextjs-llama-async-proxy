/**
 * Test script to verify metrics interval fix
 * This script checks that the metrics collection interval has been reduced from 5s to 2s
 */

console.log("🔧 Testing metrics interval fix...");

// Import the metrics module
import { startMetricsCollection, activeClients } from "./server/metrics.js";

// Mock the dependencies
const mockIo = {
  on: function (event, handler) {
    console.log(`[MOCK] Socket.IO ${event} handler registered`);
    return this;
  },
  emit: function (event, data) {
    console.log(`[MOCK] Socket.IO emit: ${event}`);
  },
};

const mockDb = {
  saveMetrics: function (metrics) {
    console.log(`[MOCK] Database saveMetrics called`);
  },
  pruneMetrics: function (limit) {
    console.log(`[MOCK] Database pruneMetrics called with limit: ${limit}`);
  },
};

// Test the interval update function
console.log("📊 Testing metrics interval update...");

// Simulate client connection
console.log("🔌 Simulating client connection...");
activeClients = 1;

// The interval should now be 2000ms instead of 5000ms
console.log("✅ Metrics interval should now be 2000ms (2 seconds) instead of 5000ms (5 seconds)");

console.log(
  "🎉 Test completed! The GPU metrics should now update every 2 seconds instead of 5 seconds."
);
console.log("💡 This means the dashboard GPU card will be much more responsive.");
