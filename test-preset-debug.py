#!/usr/bin/env python3
"""Debug preset loading"""
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)  # Show browser
    page = browser.new_page()
    
    # Capture console messages
    def handle_console(msg):
        text = msg.text
        if 'preset' in text.lower() or 'DEBUG' in text or 'error' in msg.type.lower():
            print(f"[{msg.type}] {text}")
    
    page.on('console', handle_console)
    
    try:
        page.goto('http://localhost:3000/')
        page.wait_for_load_state('networkidle')
        time.sleep(1)
        
        # Click Settings
        page.click('a[href*="settings"]')
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        
        # Check if select has options
        options = page.query_selector_all('#preset-select option')
        print(f"\nOptions count: {len(options)}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        input("Press Enter to close...")
        browser.close()
