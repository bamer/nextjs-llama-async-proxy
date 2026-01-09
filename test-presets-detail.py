#!/usr/bin/env python3
"""Test presets listing in detail."""

from playwright.sync_api import sync_playwright
import time

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        try:
            # Navigate to presets page
            page.goto("http://localhost:3000/#/presets")
            page.wait_for_load_state("networkidle")
            
            # Wait for data to load
            page.wait_for_timeout(3000)
            
            # Check network requests
            network_requests = page.evaluate("""() => {
                return {
                    title: document.title,
                    presets_list: document.querySelectorAll('.preset-item').length,
                    html_snippet: document.body.innerHTML.substring(0, 500)
                }
            }""")
            
            print(f"Title: {network_requests['title']}")
            print(f"Preset items: {network_requests['presets_list']}")
            
            # Try to access stateManager from browser
            presets_state = page.evaluate("""() => {
                return {
                    presets: window.stateManager?.getState().presets || [],
                    hasStateManager: !!window.stateManager,
                    hasSocket: !!window.socketClient
                }
            }""")
            
            print(f"\\nState Manager Info:")
            print(f"  Has StateManager: {presets_state['hasStateManager']}")
            print(f"  Has Socket: {presets_state['hasSocket']}")
            print(f"  Presets in state: {len(presets_state['presets'])}")
            if presets_state['presets']:
                print(f"  First preset: {presets_state['presets'][0]}")
            
        finally:
            browser.close()

if __name__ == "__main__":
    test()
