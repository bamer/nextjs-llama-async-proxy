const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });
  
  try {
    console.log('Navigating to http://127.0.0.1:3000/settings...');
    await page.goto('http://127.0.0.1:3000/settings', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Check metrics display
    const bodyText = await page.evaluate(() => document.body.innerText);
    
    console.log('\n=== Metrics Display Check ===');
    
    // Look for prompt t/s
    const promptMatch = bodyText.match(/Prompt[^0-9]*([0-9]+\.?[0-9]*)\s*t\/s/i);
    if (promptMatch) {
      console.log(`Prompt t/s: ${promptMatch[1]}`);
    } else {
      console.log('Prompt t/s: NOT FOUND');
    }
    
    // Look for predicted t/s
    const predMatch = bodyText.match(/Predicted[^0-9]*([0-9]+\.?[0-9]*)\s*t\/s/i);
    if (predMatch) {
      console.log(`Predicted t/s: ${predMatch[1]}`);
    } else {
      console.log('Predicted t/s: NOT FOUND');
    }
    
    // Check console for metrics-related messages
    console.log('\n=== Metrics Console Logs ===');
    const metricsLogs = consoleMessages.filter(m => 
      m.text.toLowerCase().includes('metrics') || 
      m.text.toLowerCase().includes('prompt') ||
      m.text.toLowerCase().includes('predicted') ||
      m.text.toLowerCase().includes('tokens')
    );
    metricsLogs.slice(0, 10).forEach(m => console.log(`[${m.type}] ${m.text.substring(0, 100)}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
