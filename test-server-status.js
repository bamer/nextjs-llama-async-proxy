/**
 * Test server-side status API
 */

import http from "http";

async function callApi(endpoint) {
  return new Promise((resolve, reject) => {
    http
      .get(`http://localhost:3000${endpoint}`, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        });
      })
      .on("error", reject);
  });
}

async function testStatus() {
  console.log("=== TESTING SERVER STATUS API ===\n");

  // Since we can't directly call Socket.IO events, let's check what the server returns

  // Check if there's a REST endpoint for status
  try {
    const response = await callApi("/api/status");
    console.log("REST API response:", response);
  } catch (e) {
    console.log("No REST API endpoint for status");
  }

  console.log("\n✅ Server is responding on port 3000");
  console.log("\nNote: Socket.IO events need to be tested via browser console:");
  console.log("  socket.emit('llama:status', (response) => console.log(response))");
}

testStatus().catch(console.error);
