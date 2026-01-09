#!/usr/bin/env python3
"""Test that preset combobox loads options in settings page"""
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    try:
        # Navigate to settings page
        page.goto('http://localhost:3000/')
        page.wait_for_load_state('networkidle')
        
        # Click on Settings link
        print("Navigating to Settings...")
        page.click('a[href*="settings"]')
        page.wait_for_load_state('networkidle')
        time.sleep(1)  # Wait for presets to load
        
        # Get the preset select element
        preset_select = page.query_selector('#preset-select')
        if preset_select:
            print("✓ Preset select found")
            
            # Get all options
            options = page.query_selector_all('#preset-select option')
            print(f"✓ Found {len(options)} options")
            
            # Print option values
            for i, opt in enumerate(options):
                value = opt.get_attribute('value')
                text = opt.text_content()
                print(f"  Option {i}: value='{value}' text='{text}'")
            
            # Check if we have more than just the default option
            if len(options) > 1:
                print("\n✅ SUCCESS: Preset combobox is populated with options!")
            else:
                print("\n❌ FAILED: Preset combobox only has the default option")
                
        else:
            print("❌ Preset select element not found")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        browser.close()
