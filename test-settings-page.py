#!/usr/bin/env python3
"""Check if settings page renders"""
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    try:
        page.goto('http://localhost:3000/')
        page.wait_for_load_state('networkidle')
        
        # Get current content
        content = page.content()
        print("Has 'Settings' text:", 'Settings' in content)
        print("Has 'settings-page' class:", 'settings-page' in content)
        
        # Click settings
        page.click('a[href*="settings"]')
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        
        # Get new content
        content = page.content()
        print("\nAfter clicking Settings:")
        print("Has 'Settings' h1:", '<h1' in content and 'Settings' in content)
        print("Has 'RouterConfig' text:", 'RouterConfig' in content)
        print("Has 'Router Configuration' text:", 'Router Configuration' in content)
        print("Has 'preset-select' id:", 'preset-select' in content)
        
        # Find all select elements
        selects = page.query_selector_all('select')
        print(f"Total select elements: {len(selects)}")
        for i, sel in enumerate(selects):
            select_id = sel.get_attribute('id')
            print(f"  Select {i}: id={select_id}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()
