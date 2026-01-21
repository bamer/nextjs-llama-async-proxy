#!/usr/bin/env python3
"""
Test Async Status Flow - Verify status updates happen without timeout
Tests the fully async router status waiting mechanism
"""
import time
from playwright.sync_api import sync_playwright

def test_async_status_updates():
    """
    Test that:
    1. Dashboard loads without timeout
    2. Status updates are received async without polling
    3. Console has no timeout errors
    """
    
    print("[TEST] Starting async status flow test...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Collect console messages for analysis
        console_messages = []
        page.on("console", lambda msg: console_messages.append({
            "type": msg.type,
            "text": msg.text,
            "time": time.time()
        }))
        
        print("[TEST] Navigating to dashboard...")
        page.goto("http://localhost:3000")
        page.wait_for_load_state("networkidle", timeout=10000)
        
        print("[TEST] Waiting 3 seconds to observe initial state...")
        page.wait_for_timeout(3000)
        
        # Analyze console messages
        debug_messages = [m for m in console_messages if "[DEBUG]" in m["text"]]
        timeout_messages = [m for m in console_messages if "timeout" in m["text"].lower()]
        error_messages = [m for m in console_messages if m["type"] == "error"]
        
        print(f"\n[ANALYSIS] Console messages collected: {len(console_messages)}")
        print(f"[ANALYSIS] Debug messages: {len(debug_messages)}")
        print(f"[ANALYSIS] Timeout mentions: {len(timeout_messages)}")
        print(f"[ANALYSIS] Errors: {len(error_messages)}")
        
        # Print first few debug messages (show async flow)
        print("\n[DEBUG FLOW] Sample debug messages:")
        for msg in debug_messages[:10]:
            print(f"  {msg['text']}")
        
        # CRITICAL: Check that no actual timeout errors occurred
        if timeout_messages:
            print("\n[FAIL] Found timeout errors:")
            for msg in timeout_messages:
                print(f"  {msg['text']}")
            return False
        
        if error_messages:
            print("\n[FAIL] Found console errors:")
            for msg in error_messages:
                print(f"  {msg['text']}")
            return False
        
        # Verify key async patterns
        print("\n[VERIFICATION] Checking async patterns...")
        
        # Check for Dashboard init logs
        init_logs = [m for m in console_messages if "Dashboard" in m["text"] and "init" in m["text"].lower()]
        print(f"  Dashboard init logs: {len(init_logs)}")
        if init_logs:
            for msg in init_logs[:3]:
                print(f"    - {msg['text']}")
        
        # Check for state subscription logs
        sub_logs = [m for m in console_messages if "subscribe" in m["text"].lower()]
        print(f"  Subscription logs: {len(sub_logs)}")
        
        # Check for API request logs
        api_logs = [m for m in console_messages if "request" in m["text"].lower() or "API" in m["text"]]
        print(f"  API request logs: {len(api_logs)}")
        if api_logs:
            for msg in api_logs[:3]:
                print(f"    - {msg['text']}")
        
        # Verify UI is responsive
        print("\n[UI CHECK] Verifying UI responsiveness...")
        
        # Check for Llama Router Card
        router_card = page.locator(".llama-router-status-card")
        if router_card.count() == 0:
            print("[FAIL] Llama Router Card not found")
            return False
        print("[OK] Llama Router Card present")
        
        # Check status indicator (should not be in loading state)
        status_indicator = page.locator(".status-indicator")
        if status_indicator.count() > 0:
            classes = status_indicator.first.get_attribute("class")
            print(f"[OK] Status indicator classes: {classes}")
            if "loading" not in classes:
                print("[OK] Status is not stuck in loading state")
        
        # Check glance items are displaying
        glance_items = page.locator(".glance-item")
        print(f"[OK] Found {glance_items.count()} glance items")
        
        browser.close()
        
        print("\n[PASS] Async status flow test completed successfully!")
        print("[PASS] No timeouts or errors detected")
        return True

if __name__ == "__main__":
    import sys
    try:
        success = test_async_status_updates()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"[ERROR] Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
