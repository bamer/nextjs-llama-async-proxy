const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Collect console logs
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  // Navigate to settings page
  console.log('Navigating to settings page...');
  await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle' });
  
  // Wait a bit for any status changes
  await page.waitForTimeout(5000);
  
  // Check router card status
  const statusText = await page.$eval('.badge-text', el => el.textContent).catch(() => 'NOT FOUND');
  console.log('Router status:', statusText);
  
  // Check for any errors in logs
  const errors = logs.filter(l => l.includes('error') || l.includes('Error') || l.includes('disconnect') || l.includes('Disconnected'));
  if (errors.length > 0) {
    console.log('Errors/disconnects found:');
    errors.forEach(e => console.log('  ', e));
  } else {
    console.log('No errors or disconnects found');
  }
  
  await browser.close();
  console.log('Test complete');
})();
