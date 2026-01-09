#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')
    
    # Navigate to presets page
    page.click('a:has-text("Presets")')
    page.wait_for_load_state('networkidle')
    time.sleep(0.5)
    
    # Click on default preset - try multiple ways
    try:
        # Find the preset item with text "default"
        selector = '.preset-item:has-text("default")'
        page.click(selector)
        page.wait_for_load_state('networkidle')
        time.sleep(1)
    except Exception as e:
        print(f"Error clicking preset: {e}")
    
    # Take screenshot
    page.screenshot(path='/tmp/presets-detail.png', full_page=True)
    print("Screenshot saved to /tmp/presets-detail.png")
    
    browser.close()
