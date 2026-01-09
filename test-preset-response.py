#!/usr/bin/env python3
"""Check preset response"""
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    console_logs = []
    
    def handle_console(msg):
        console_logs.append(f"[{msg.type}] {msg.text}")
    
    page.on('console', handle_console)
    
    try:
        page.goto('http://localhost:3000/')
        page.wait_for_load_state('networkidle')
        console_logs.clear()
        
        page.click('a[href*="settings"]')
        page.wait_for_load_state('networkidle')
        time.sleep(1)
        
        for log in console_logs:
            if 'Got presets response' in log:
                print(f"Response log: {log}")
                # The log will show like: [log] [ROUTER-CONFIG] Got presets response: {presets: Array(1)}
                break
        
        # Check the actual select options
        options = page.query_selector_all('#preset-select option')
        print(f"\nSelect options: {len(options)}")
        for i, opt in enumerate(options):
            print(f"  {i}: {opt.get_attribute('value')} = {opt.text_content()}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()
