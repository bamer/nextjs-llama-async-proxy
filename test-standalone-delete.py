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
            page.screenshot(path="/tmp/presets_before.png", full_page=True)
            
            # Check if there are any standalone models
            standalone_section = page.locator(".standalone-section")
            print(f"Standalone section visible: {standalone_section.is_visible()}")
            
            # Look for delete buttons in standalone section
            delete_buttons = page.locator("[data-action='delete-model'][data-group-name='']")
            count = delete_buttons.count()
            print(f"Found {count} delete buttons for standalone models")
            
            if count > 0:
                # Get the first standalone model name
                first_model = page.locator(".standalone-list .model-header .section-title").first
                model_name = first_model.text_content()
                print(f"First standalone model: {model_name}")
                
                # Find and click the delete button for this model
                delete_btn = page.locator(f"[data-action='delete-model'][data-model-name='{model_name}'][data-group-name='']")
                print(f"Delete button found: {delete_btn.is_visible()}")
                
                # Click it
                delete_btn.click()
                
                # Handle confirmation dialog if it appears
                try:
                    page.on("dialog", lambda dialog: dialog.accept())
                    page.wait_for_timeout(1000)
                except:
                    pass
                
                # Take screenshot after delete
                time.sleep(1)
                page.screenshot(path="/tmp/presets_after.png", full_page=True)
                print("Delete action completed")
            else:
                print("No standalone models to delete")
            
        finally:
            browser.close()

if __name__ == "__main__":
    test_delete_standalone_model()
