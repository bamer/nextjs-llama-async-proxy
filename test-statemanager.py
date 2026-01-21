#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import time

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        page.goto('http://localhost:3000/')
        time.sleep(2)
        
        # Check what's on the page
        result = page.evaluate("""
          () => {
            return {
              hasStateManager: typeof window.stateManager !== 'undefined',
              hasGetConfig: typeof window.stateManager?.getConfig === 'function',
              stateManagerType: typeof window.stateManager,
              stateManagerKeys: Object.keys(window.stateManager || {}),
            };
          }
        """)
        
        print(f"\n{result}\n")
        
        # Try to call it
        result2 = page.evaluate("""
          () => {
            try {
              const config = window.stateManager.getConfig();
              return {
                success: true,
                type: typeof config,
                isPromise: config instanceof Promise,
              };
            } catch (e) {
              return { success: false, error: e.message };
            }
          }
        """)
        
        print(f"Call result: {result2}\n")
        
        browser.close()

if __name__ == '__main__':
    test()
