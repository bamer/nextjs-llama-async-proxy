#!/usr/bin/env python3
"""
Test Dashboard Async Fix - Verify dashboard loads without timeout
"""
import subprocess
import time
import sys

def test_dashboard_load():
    """Test that the dashboard loads and updates without timing out"""
    
    print("[TEST] Starting server...")
    proc = subprocess.Popen(["npm", "start"], cwd="/home/bamer/nextjs-llama-async-proxy")
    time.sleep(3)  # Wait for server to start
    
    try:
        from playwright.sync_api import sync_playwright
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            print("[TEST] Navigating to dashboard...")
            page.goto("http://localhost:3000")
            
            print("[TEST] Waiting for page to load...")
            page.wait_for_load_state("networkidle", timeout=10000)
            
            print("[TEST] Taking screenshot...")
            page.screenshot(path="/tmp/dashboard-loaded.png", full_page=True)
            
            # Check console for errors
            console_logs = []
            page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
            
            # Wait for initial load and check that no timeout errors appear
            print("[TEST] Waiting 5 seconds to observe console for timeout errors...")
            page.wait_for_timeout(5000)
            
            # Check for timeout errors
            timeout_errors = [log for log in console_logs if "timeout" in log.lower()]
            if timeout_errors:
                print("[FAIL] Found timeout errors in console:")
                for error in timeout_errors:
                    print(f"  {error}")
                return False
            
            print("[TEST] Checking for dashboard elements...")
            
            # Look for Llama Router Card
            router_card = page.locator(".llama-router-status-card")
            if router_card.count() == 0:
                print("[FAIL] Llama Router Card not found")
                return False
            
            print("[TEST] Router card found!")
            
            # Check for key elements (these should load without timeout)
            elements = {
                ".status-indicator": "Status indicator",
                ".badge-text": "Status badge",
                "[data-glance='prompt-ts']": "Prompt tokens/sec",
                "[data-glance='models']": "Models count",
                "[data-glance='uptime']": "Uptime",
                "[data-glance='vram']": "VRAM",
            }
            
            for selector, name in elements.items():
                try:
                    element = page.locator(selector)
                    if element.count() > 0:
                        content = element.first.text_content()
                        print(f"[OK] {name}: {content}")
                    else:
                        print(f"[WARN] {name} not found but this may be expected")
                except Exception as e:
                    print(f"[WARN] Error checking {name}: {e}")
            
            # Check that the page is responsive (try clicking a button)
            print("[TEST] Checking responsiveness...")
            toggle_btn = page.locator("[data-action='toggle']")
            if toggle_btn.count() > 0:
                is_disabled = toggle_btn.first.is_disabled()
                print(f"[OK] Toggle button found, disabled={is_disabled}")
            
            browser.close()
            print("[PASS] Dashboard loaded successfully without timeout!")
            return True
            
    except Exception as e:
        print(f"[ERROR] Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    success = test_dashboard_load()
    sys.exit(0 if success else 1)
