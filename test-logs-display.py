#!/usr/bin/env python3
"""Test that logs page displays logs correctly after timestamp fix"""

from playwright.sync_api import sync_playwright
import time

def test_logs_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Navigate to logs page
        page.goto("http://localhost:3000/#/logs")
        page.wait_for_load_state("networkidle")
        
        # Take screenshot
        page.screenshot(path="/tmp/logs-page.png", full_page=True)
        
        # Check if logs are displayed
        logs_container = page.locator(".logs-container")
        content = logs_container.inner_text()
        
        print("Logs container content:")
        print(content[:500])  # Print first 500 chars
        
        # Check if we see actual logs (not "No logs found")
        if "No logs found" in content:
            print("\n❌ FAIL: No logs displayed")
            return False
        elif "log-entry" in page.content():
            log_count = page.locator(".log-entry").count()
            print(f"\n✓ SUCCESS: {log_count} logs displayed")
            return True
        else:
            print("\n⚠ WARNING: Could not determine log status")
            return False
        
        browser.close()

if __name__ == "__main__":
    test_logs_page()
