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
        
        # Test 1: Immediate .then()
        print("\n[TEST 1] Immediate .then()...")
        page.evaluate("""
          () => {
            console.log('[T1] Calling getConfig');
            stateManager.getConfig()
              .then((cfg) => console.log('[T1] THEN called'))
              .catch((e) => console.log('[T1] CATCH called:', e.message));
            console.log('[T1] After .then()');
          }
        """)
        
        time.sleep(1)
        print(f"Logs with T1: {[l for l in logs if 'T1' in l]}")
        
        # Test 2: Delayed .then()
        print("\n[TEST 2] Delayed .then()...")
        logs.clear()
        page.evaluate("""
          () => {
            console.log('[T2] Calling getConfig');
            const p = stateManager.getConfig();
            console.log('[T2] Got promise:', typeof p);
            setTimeout(() => {
              console.log('[T2] In timeout, calling .then()');
              p.then((cfg) => console.log('[T2] THEN called'))
                .catch((e) => console.log('[T2] CATCH called:', e.message));
            }, 100);
          }
        """)
        
        time.sleep(1)
        print(f"Logs with T2: {[l for l in logs if 'T2' in l]}")
        
        browser.close()

if __name__ == '__main__':
    test()
