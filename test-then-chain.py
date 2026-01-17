#!/usr/bin/env python3
"""
Test if .then() works on the stateManager promises
"""

from playwright.sync_api import sync_playwright
import time

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        logs = []
        def on_console(msg):
            logs.append(f"[{msg.type}] {msg.text}")
        
        page.on("console", on_console)
        
        page.goto('http://localhost:3000/')
        time.sleep(2)
        
        # Test the exact pattern used in the controller
        print("\n[TEST] Testing .then() chain...\n")
        
        result = page.evaluate("""
          () => {
            console.log('[THEN-TEST] Starting...');
            
            stateManager.getConfig()
              .then((config) => {
                console.log('[THEN-TEST] THEN CALLBACK CALLED!');
                console.log('[THEN-TEST] Got config:', !!config);
                return config;
              })
              .catch((e) => {
                console.log('[THEN-TEST] CATCH CALLED!');
                console.error('[THEN-TEST] Error:', e.message);
              });
              
            console.log('[THEN-TEST] After calling .then()');
            return 'DONE';
          }
        """)
        
        print(f"Result: {result}\n")
        
        # Wait a bit for async callbacks
        time.sleep(2)
        
        # Find logs
        print("Relevant logs:")
        for log in logs:
            if 'THEN-TEST' in log or 'THEN' in log:
                print(f"  {log}")
        
        browser.close()

if __name__ == '__main__':
    test()
