/**
 * Llama Router API
 * HTTP communication with llama-server
 */

import http from "http";

/**
 * Make HTTP request to llama-server API.
 * Sends an HTTP request to the llama-server and returns the parsed response.
 * @param {string} endpoint - API endpoint path (e.g., "/models", "/models/load").
 * @param {string} [method="GET"] - HTTP method (GET, POST, DELETE, etc.).
 * @param {Object|null} [body=null] - Request body for POST/PUT requests.
 * @param {string} llamaServerUrl - Base URL of the llama-server.
 * @returns {Promise<Object|string>} Parsed JSON response or raw string response.
 * @throws {Error} If llama-server is not running or request fails.
 */
export async function llamaApiRequest(endpoint, method = "GET", body = null, llamaServerUrl) {
  if (!llamaServerUrl) {
    throw new Error("llama-server not running");
  }

  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, llamaServerUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      // Add timeout to prevent hanging connections
      timeout: 5000, // 5 second timeout for API calls
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on("error", (e) => {
      // Don't log connection errors as warnings - they're expected when server is down
      reject(new Error(`Connection failed: ${e.message}`));
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout (5s)"));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}
