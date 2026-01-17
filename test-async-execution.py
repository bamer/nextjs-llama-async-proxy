#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import time

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        logs = []
        page.on("console", lambda msg: logs.append(f"[{msg.type}] {msg.text}"))
        
        page.goto('http://localhost:3000/')
        time.sleep(2)
        
        # Test if async function body is executed
        page.evaluate("""
          () => {
            console.log('[ASYNC-TEST] Creating async function');
            
            const asyncFunc = async () => {
              console.log('[ASYNC-TEST] Inside async function body');
              return 'result';
            };
            
            console.log('[ASYNC-TEST] Calling async function');
            const promise = asyncFunc();
            console.log('[ASYNC-TEST] Got promise:', typeof promise);
            
            // Don't attach .then() yet
            console.log('[ASYNC-TEST] Before attaching .then()');
          }
        """)
        
        time.sleep(1)
        print("Logs:")
        for log in logs:
            if 'ASYNC-TEST' in log:
                print(f"  {log}")
        
        browser.close()

if __name__ == '__main__':
    test()
