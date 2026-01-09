#!/usr/bin/env python3
"""Wait longer for settings to load"""
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
        time.sleep(1)
        
        # Clear logs before nav
        console_logs.clear()
        
        print("Clicking Settings link...")
        page.click('a[href*="settings"]')
        
        # Wait longer
        for i in range(10):
            time.sleep(1)
            print(f"Wait {i+1}/10 seconds...")
            if any('[ROUTER] Appending' in log for log in console_logs):
                print("Element appended!")
                break
        
        print("\nRouter logs:")
        for log in console_logs[-20:]:
            if '[ROUTER]' in log or 'SettingsController' in log:
                print(f"  {log}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()
