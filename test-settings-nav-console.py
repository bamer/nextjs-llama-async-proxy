#!/usr/bin/env python3
"""Capture console logs during settings navigation"""
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
        
        print("Clicking Settings...")
        page.click('a[href*="settings"]')
        page.wait_for_load_state('networkidle')
        time.sleep(1)
        
        print("\nAll logs after clicking Settings:")
        for i, log in enumerate(console_logs):
            if 'Component.h' in log or 'Router' in log or 'RouteConfig' in log.upper() or 'presets' in log.lower():
                print(f"{i}: {log}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()
