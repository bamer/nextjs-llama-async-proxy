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
    time.sleep(1)
    
    # Take screenshot
    page.screenshot(path='/tmp/presets-buttons.png', full_page=True)
    print("Screenshot saved to /tmp/presets-buttons.png")
    
    browser.close()
