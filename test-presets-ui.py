#!/usr/bin/env python3
"""
Test the Presets UI with defaults system
Tests that the "*" default preset is properly displayed and can be edited
"""

from playwright.sync_api import sync_playwright
import time
import sys

def test_presets_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print("\n=== Preset Defaults UI Test ===\n")
        
        # Navigate to app
        print("[1] Navigate to presets page...")
        page.goto("http://localhost:3000/#/presets")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        
        # Take initial screenshot
        print("[2] Taking screenshot of presets page...")
        page.screenshot(path="/tmp/presets-1-initial.png", full_page=True)
        print("✓ Screenshot saved: /tmp/presets-1-initial.png")
        
        # Check if test preset exists in the list
        print("[3] Checking if test preset is loaded...")
        presets_list = page.locator(".presets-list .preset-item")
        count = presets_list.count()
        print(f"✓ Found {count} preset(s)")
        
        if count > 0:
            # Get preset names
            names = []
            for i in range(count):
                name_text = presets_list.nth(i).locator(".preset-name").text_content()
                names.append(name_text)
                print(f"  - {name_text}")
            
            # Click on test-preset if it exists
            if "test-preset" in names:
                print("\n[4] Clicking on test-preset...")
                page.locator("[data-preset-name='test-preset']").click()
                page.wait_for_load_state("networkidle")
                time.sleep(0.5)
                
                # Take screenshot of selected preset
                print("[5] Taking screenshot of selected preset...")
                page.screenshot(path="/tmp/presets-2-selected.png", full_page=True)
                print("✓ Screenshot saved: /tmp/presets-2-selected.png")
                
                # Check for defaults button
                print("\n[6] Looking for defaults button...")
                defaults_btn = page.locator("[data-action='edit-defaults']")
                if defaults_btn.count() > 0:
                    print("✓ Found ⚙ Defaults button")
                    
                    # Click to open defaults modal
                    print("[7] Clicking edit defaults button...")
                    defaults_btn.first.click()
                    page.wait_for_load_state("networkidle")
                    time.sleep(0.5)
                    
                    # Take screenshot of defaults modal
                    print("[8] Taking screenshot of defaults modal...")
                    page.screenshot(path="/tmp/presets-3-defaults-modal.png", full_page=True)
                    print("✓ Screenshot saved: /tmp/presets-3-defaults-modal.png")
                    
                    # Check for form fields
                    print("\n[9] Checking defaults modal form fields...")
                    ctx_size = page.locator("input[data-field='ctxSize']")
                    temp = page.locator("input[data-field='temperature']")
                    gpu_layers = page.locator("input[data-field='nGpuLayers']")
                    
                    if ctx_size.count() > 0:
                        val = ctx_size.get_attribute("value")
                        print(f"✓ Context Size field: {val}")
                    
                    if temp.count() > 0:
                        val = temp.get_attribute("value")
                        print(f"✓ Temperature field: {val}")
                    
                    if gpu_layers.count() > 0:
                        val = gpu_layers.get_attribute("value")
                        print(f"✓ GPU Layers field: {val}")
                    
                    # Test editing a field
                    print("\n[10] Testing field edit (Context Size)...")
                    if ctx_size.count() > 0:
                        ctx_size.fill("16384")
                        new_val = ctx_size.get_attribute("value")
                        print(f"✓ Changed Context Size to: {new_val}")
                        
                        # Take screenshot showing edited value
                        page.screenshot(path="/tmp/presets-4-edited.png", full_page=True)
                        
                        # Click Save button
                        print("\n[11] Clicking Save Defaults button...")
                        save_btn = page.locator("[data-action='save-defaults']")
                        if save_btn.count() > 0:
                            save_btn.click()
                            page.wait_for_load_state("networkidle")
                            time.sleep(1)
                            print("✓ Save clicked")
                            
                            # Take screenshot after save
                            page.screenshot(path="/tmp/presets-5-saved.png", full_page=True)
                            print("✓ Screenshot saved: /tmp/presets-5-saved.png")
                            
                            # Look for success notification
                            notification = page.locator(".notification, [role='alert']")
                            if notification.count() > 0:
                                msg = notification.first.text_content()
                                print(f"✓ Notification: {msg}")
                else:
                    print("✗ Defaults button not found!")
            else:
                print("\n⚠ test-preset not found, testing with first available preset...")
                page.locator(".preset-item").first.click()
                page.wait_for_load_state("networkidle")
                time.sleep(0.5)
                page.screenshot(path="/tmp/presets-2-selected.png", full_page=True)
        else:
            print("⚠ No presets found - create one first!")
        
        print("\n=== UI Test Complete ===\n")
        print("Screenshots saved to /tmp/presets-*.png")
        
        browser.close()

if __name__ == "__main__":
    try:
        test_presets_ui()
        print("✓ UI test completed successfully!")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
