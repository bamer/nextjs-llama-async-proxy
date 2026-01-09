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
    time.sleep(1)
    
    # Take screenshot
    page.screenshot(path='/tmp/presets-groups-check.png', full_page=True)
    print("Screenshot saved")
    
    # Get the body text to see what sections exist
    body_text = page.text_content('body')
    if 'GROUPS' in body_text:
        print("GROUPS section found")
    if 'STANDALONE MODELS' in body_text:
        print("STANDALONE MODELS section found")
    
    browser.close()
