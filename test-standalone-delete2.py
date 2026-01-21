#!/usr/bin/env python3
"""Test standalone model deletion in presets page."""

from playwright.sync_api import sync_playwright
import time

def test_delete_standalone_model():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        try:
            # Navigate to presets page
            page.goto("http://localhost:3000/#/presets")
            page.wait_for_load_state("networkidle")
            
            # Take screenshot to see current state
            page.screenshot(path="/tmp/presets_init.png", full_page=True)
            
            # Select the first preset (should be "default")
            presets = page.locator("[data-action='select-preset']").first
            if presets.is_visible():
                presets.click()
                page.wait_for_timeout(1000)
                print("Clicked first preset")
            
            # Take screenshot after selecting preset
            page.screenshot(path="/tmp/presets_selected.png", full_page=True)
            
            # Check if there are any standalone models
            standalone_section = page.locator(".standalone-section")
            print(f"Standalone section visible: {standalone_section.is_visible()}")
            
            # Look for delete buttons in standalone section
            delete_buttons = page.locator("[data-action='delete-model'][data-group-name='']")
            count = delete_buttons.count()
            print(f"Found {count} delete buttons for standalone models")
            
            # List all elements in standalone section
            all_delete_btns = page.locator("[data-action='delete-model']")
            print(f"Total delete buttons on page: {all_delete_btns.count()}")
            
            # Print HTML of first few delete buttons
            for i in range(min(3, all_delete_btns.count())):
                btn = all_delete_btns.nth(i)
                html = page.evaluate("(el) => el.outerHTML", btn)
                print(f"Delete button {i}: {html[:150]}")
            
        finally:
            browser.close()

if __name__ == "__main__":
    test_delete_standalone_model()
