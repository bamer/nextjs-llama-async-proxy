#!/usr/bin/env python3
"""
Test if the promise chain works
"""

from playwright.sync_api import sync_playwright
import time

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        # Capture all logs
        logs = []
        def on_console(msg):
            logs.append(f"[{msg.type}] {msg.text}")
        
        page.on("console", on_console)
        
        page.goto('http://localhost:3000/')
        time.sleep(3)
        
        # Test the promise chain
        print("\n[TEST] Testing promise chain...\n")
        
        result = page.evaluate("""
          async () => {
            console.log('[PROMISE] Starting test...');
            
            try {
              console.log('[PROMISE] Calling getMetrics...');
              const metricsPromise = window.stateManager.getMetrics();
              console.log('[PROMISE] Promise returned:', typeof metricsPromise);
              
              const metrics = await metricsPromise;
              console.log('[PROMISE] Await resolved:', !!metrics);
              console.log('[PROMISE] Metrics object:', metrics);
              
              return { success: true, metrics };
            } catch (e) {
              console.log('[PROMISE] Error:', e.message);
              return { success: false, error: e.message };
            }
          }
        """)
        
        print(f"Result: {result}\n")
        
        # Find promise-related logs
        print("Promise-related logs:")
        for log in logs:
            if 'PROMISE' in log or 'metrics' in log.lower():
                print(f"  {log}")
        
        browser.close()

if __name__ == '__main__':
    test()
