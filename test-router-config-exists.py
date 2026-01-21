#!/usr/bin/env python3
"""Check if window.RouterConfig exists"""
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    try:
        page.goto('http://localhost:3000/')
        page.wait_for_load_state('networkidle')
        time.sleep(1)
        
        # Check if RouterConfig is defined
        result = page.evaluate('() => typeof window.RouterConfig')
        print(f"window.RouterConfig type: {result}")
        
        # Try to find the select element
        select = page.query_selector('#preset-select')
        print(f"Preset select exists: {select is not None}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()
