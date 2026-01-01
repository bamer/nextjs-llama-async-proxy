#!/usr/bin/env node
// Simple health check script
import http from 'http';

function checkServer(url, retries = 10, delay = 2000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const tryRequest = () => {
      attempts++;
      console.log(`Attempt ${attempts}/${retries}: Checking ${url}...`);

      const req = http.get(url, (res) => {
        console.log(`✓ Server responded with status: ${res.statusCode}`);
        resolve({
          success: true,
          statusCode: res.statusCode,
          attempts
        });
      });

      req.on('error', (err) => {
        console.log(`✗ Request failed: ${err.message}`);
        if (attempts < retries) {
          setTimeout(tryRequest, delay);
        } else {
          reject(new Error(`Failed after ${retries} attempts`));
        }
      });

      req.setTimeout(5000, () => {
        req.abort();
        console.log(`✗ Request timed out`);
        if (attempts < retries) {
          setTimeout(tryRequest, delay);
        } else {
          reject(new Error(`Timed out after ${retries} attempts`));
        }
      });
    };

    tryRequest();
  });
}

async function main() {
  console.log('Checking if server is ready...\n');

  try {
    const result = await checkServer('http://localhost:3000/');
    console.log('\n✅ Server is ready!');
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Server not ready: ${error.message}`);
    process.exit(1);
  }
}

main();
