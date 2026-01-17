#!/usr/bin/env python3
"""
Test with server log inspection
"""

from playwright.sync_api import sync_playwright
import time
import subprocess
import threading

def test_with_logs():
    """Run test and capture server logs"""
    
    print("\n" + "=" * 80)
    print("TESTING WITH SERVER LOG INSPECTION")
    print("=" * 80)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        # Capture console messages
        console_messages = []
        def on_console(msg):
            if any(x in msg.text for x in ["metrics", "Models", "Config", "loaded", "DASHBOARD", "DashboardPage"]):
                console_messages.append(f"[{msg.type}] {msg.text}")
        
        page.on("console", on_console)
        
        print("\n[NAVIGATE] Going to dashboard...")
        page.goto('http://localhost:3000/')
        
        print("[WAIT] Waiting for data to load...")
        time.sleep(2)
        
        # Check if any loads happened
        print("\n[CONSOLE] Relevant messages:")
        for msg in console_messages:
            print(f"  {msg}")
        
        if not console_messages:
            print("  (No relevant console messages)")
        
        # Check if metrics are in state
        print("\n[STATE] Checking state...")
        metrics = page.evaluate("() => {const m = window.stateManager?.get('metrics'); console.log('[EVAL] Metrics:', m); return m;}")
        print(f"  Metrics loaded: {metrics is not None}")
        
        if metrics:
            print(f"  CPU: {metrics.get('cpu', {}).get('usage', 'N/A')}%")
        
        # Manual request test
        print("\n[MANUAL TEST] Sending manual metrics request...")
        response = page.evaluate("""
          async () => {
            try {
              console.log('[MANUAL] Requesting metrics...');
              const result = await window.stateManager.getMetrics();
              console.log('[MANUAL] Response:', result);
              return { success: true, data: result };
            } catch (e) {
              console.log('[MANUAL] Error:', e.message);
              return { success: false, error: e.message };
            }
          }
        """)
        
        print(f"  Result: {response}")
        
        time.sleep(1)
        
        print("\n[CONSOLE] Messages after manual test:")
        for msg in console_messages[-5:]:
            print(f"  {msg}")
        
        browser.close()

if __name__ == '__main__':
    test_with_logs()
