#!/usr/bin/env python3
"""Test presets API endpoint"""
from playwright.sync_api import sync_playwright
import time
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    # Capture network requests
    requests = []
    
    def handle_request(request):
        if 'presets' in request.url or 'preset' in request.url.lower():
            requests.append({
                'url': request.url,
                'method': request.method,
            })
    
    page.on('request', handle_request)
    
    try:
        # Navigate to settings page
        page.goto('http://localhost:3000/')
        page.wait_for_load_state('networkidle')
        
        # Check console for errors
        console_messages = []
        page.on('console', lambda msg: console_messages.append({
            'type': msg.type,
            'text': msg.text
        }))
        
        # Click on Settings link
        print("Navigating to Settings...")
        page.click('a[href*="settings"]')
        page.wait_for_load_state('networkidle')
        time.sleep(2)  # Wait for presets to load
        
        print(f"\nNetwork requests related to presets:")
        for req in requests:
            print(f"  {req['method']} {req['url']}")
        
        print(f"\nConsole messages (last 10):")
        for msg in console_messages[-10:]:
            if 'DEBUG' in msg['text'] or 'preset' in msg['text'].lower() or 'error' in msg['type'].lower():
                print(f"  [{msg['type']}] {msg['text']}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()
