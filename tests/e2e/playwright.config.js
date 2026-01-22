const { devices } = require('@playwright/test');

module.exports = {
  testDir: './tests/e2e',
  timeout: 60000,
  retries: 1,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    headless: true,
    viewport: { width: 1280, height: 800 },
    trace: 'on-first-retry',
  },
};
