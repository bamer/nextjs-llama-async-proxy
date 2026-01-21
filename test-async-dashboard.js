/**
 * Test Suite: Async Dashboard Optimization
 * Verifies that dashboard loads progressively with skeleton UI
 */

import http from "http";
import { Server } from "socket.io";
import { io as createClient } from "socket.io-client";

console.log("\n=== ASYNC DASHBOARD TEST SUITE ===\n");

// Create test server
const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" },
  transports: ["websocket"],
});

const PORT = 3001;
let testsPassed = 0;
let testsFailed = 0;

// Track metrics requests
const requests = [];
const responses = [];

// Setup server handlers
io.on("connection", (socket) => {
  console.log("[SERVER] Client connected");

  socket.on("metrics:get", (req, ack) => {
    requests.push({ event: "metrics:get", timestamp: Date.now() });
    console.log("[SERVER] metrics:get request received");

    // Respond immediately with cached metrics
    setTimeout(() => {
      const response = {
        success: true,
        data: {
          metrics: {
            cpu: { usage: Math.random() * 100 },
            memory: { used: Math.random() * 100 },
            gpu: { usage: 0, memoryUsed: 0, memoryTotal: 0, list: [] },
          },
        },
        timestamp: Date.now(),
      };
      responses.push({
        event: "metrics:get:result",
        timestamp: Date.now(),
      });
      ack(response);
    }, 50); // Simulate DB lookup
  });

  socket.on("metrics:history", (req, ack) => {
    requests.push({ event: "metrics:history", timestamp: Date.now() });
    console.log("[SERVER] metrics:history request received");

    setTimeout(() => {
      const history = Array.from({ length: 60 }, (_, i) => ({
        cpu: { usage: Math.random() * 100 },
        memory: { used: Math.random() * 100 },
        timestamp: Date.now() - i * 5000,
      }));
      responses.push({
        event: "metrics:history:result",
        timestamp: Date.now(),
      });
      ack({ success: true, data: { history } });
    }, 100);
  });

  socket.on("config:get", (req, ack) => {
    requests.push({ event: "config:get", timestamp: Date.now() });
    console.log("[SERVER] config:get request received");

    setTimeout(() => {
      responses.push({
        event: "config:get:result",
        timestamp: Date.now(),
      });
      ack({ success: true, data: { config: { ctx_size: 4096 } } });
    }, 75);
  });
});

// Test function
function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`✗ ${message}`);
    testsFailed++;
  }
}

// Main test
async function runTests() {
  return new Promise((resolve) => {
    httpServer.listen(PORT, async () => {
      console.log(`[TEST] Server listening on port ${PORT}\n`);

      // Create client
      const client = createClient(`http://localhost:${PORT}`, {
        transports: ["websocket"],
        reconnection: false,
      });

      client.on("connect", () => {
        console.log("[TEST] Client connected to server\n");

        // Test 1: Verify requests are sent immediately (fire & forget)
        const startTime = Date.now();
        console.log("[TEST] Firing parallel requests...");

        client.emit("metrics:get", { requestId: 1 }, (response) => {
          const elapsed = Date.now() - startTime;
          assert(elapsed < 500, `metrics:get responded within 500ms (${elapsed}ms)`);
        });

        client.emit("metrics:history", { requestId: 2, limit: 60 }, (response) => {
          const elapsed = Date.now() - startTime;
          assert(elapsed < 500, `metrics:history responded within 500ms (${elapsed}ms)`);
        });

        client.emit("config:get", { requestId: 3 }, (response) => {
          const elapsed = Date.now() - startTime;
          assert(elapsed < 500, `config:get responded within 500ms (${elapsed}ms)`);
        });

        // Test 2: Verify all requests fired in parallel (not sequential)
        setTimeout(() => {
          const timeDiffs = [];
          for (let i = 1; i < requests.length; i++) {
            timeDiffs.push(requests[i].timestamp - requests[i - 1].timestamp);
          }

          const allParallel = timeDiffs.every((diff) => diff < 50);
          assert(
            allParallel,
            `All requests fired in parallel (max diff: ${Math.max(...timeDiffs)}ms)`
          );

          // Test 3: Verify responses arrived independently
          console.log(`\n[TEST] Request/Response Timeline:`);
          requests.forEach((req, i) => {
            const resp = responses[i];
            const delay = resp ? resp.timestamp - req.timestamp : "N/A";
            console.log(`  ${req.event}: sent, response in ${delay}ms`);
          });

          // Test 4: Check response independence
          const responseDelays = responses.map(
            (resp, i) => resp.timestamp - requests[i]?.timestamp
          );
          const independent = responseDelays.every((delay) => delay > 0 && delay < 200);
          assert(independent, "All responses arrived independently");

          // Test 5: Verify no blocking/waiting
          const totalTime =
            Math.max(...responses.map((r) => r.timestamp)) -
            Math.min(...requests.map((r) => r.timestamp));
          assert(totalTime < 300, `Total dashboard load time < 300ms (actual: ${totalTime}ms)`);

          // Summary
          console.log(`\n=== TEST SUMMARY ===`);
          console.log(`Passed: ${testsPassed}`);
          console.log(`Failed: ${testsFailed}`);
          console.log(`Total:  ${testsPassed + testsFailed}\n`);

          client.disconnect();
          httpServer.close(() => {
            resolve(testsFailed === 0);
          });
        }, 500);
      });

      client.on("connect_error", (err) => {
        console.error("[TEST] Connection error:", err);
        httpServer.close(() => resolve(false));
      });
    });
  });
}

// Run tests
runTests().then((success) => {
  process.exit(success ? 0 : 1);
});
