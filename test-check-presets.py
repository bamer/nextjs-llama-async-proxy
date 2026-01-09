#!/usr/bin/env python3
"""Check if presets exist in the database."""

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
            
            # Wait a bit for data to load
            page.wait_for_timeout(2000)
            
            # Take full screenshot
            page.screenshot(path="/tmp/presets_full.png", full_page=True)
            
            # Get page content
            content = page.content()
            
            # Print relevant parts
            if "No Presets Yet" in content:
                print("ERROR: No presets created yet")
            elif "Select a preset to edit" in content:
                print("Presets loaded but none selected")
            else:
                print("Page loaded")
            
            # Check for preset items
            preset_items = page.locator(".preset-item")
            print(f"Preset items found: {preset_items.count()}")
            
            for i in range(preset_items.count()):
                item = preset_items.nth(i)
                name = item.locator(".preset-name").text_content() if item.locator(".preset-name").is_visible() else "unknown"
                print(f"  Preset {i}: {name}")
            
        finally:
            browser.close()

if __name__ == "__main__":
    test()
