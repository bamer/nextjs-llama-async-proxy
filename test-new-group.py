#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')
    
    # Navigate to presets
    page.click('a:has-text("Presets")')
    page.wait_for_load_state('networkidle')
    time.sleep(0.5)
    
    # Click on default preset
    page.click('.preset-item:has-text("default")')
    page.wait_for_load_state('networkidle')
    time.sleep(0.5)
    
    # Click Add Group button
    page.click('button:has-text("+ Add Group")')
    time.sleep(0.3)
    
    # Handle prompt by filling group name
    page.on("dialog", lambda dialog: (
        dialog.accept("test_group_fixed"),
        print(f"Dialog accepted with: test_group_fixed")
    ))
    
    page.wait_for_load_state('networkidle')
    time.sleep(1)
    
    # Take screenshot
    page.screenshot(path='/tmp/presets-new-group.png', full_page=True)
    print("Screenshot saved to /tmp/presets-new-group.png")
    
    browser.close()
