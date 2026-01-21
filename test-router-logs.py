#!/usr/bin/env python3
"""Capture all router logs"""
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
        time.sleep(0.5)
        
        # Clear logs before nav
        console_logs.clear()
        
        print("Clicking Settings link...")
        page.click('a[href*="settings"]')
        page.wait_for_load_state('networkidle')
        time.sleep(1)
        
        print("\nRouter logs after clicking Settings:")
        for log in console_logs:
            if '[ROUTER]' in log:
                print(f"  {log}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()
