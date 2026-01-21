#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import time

def test_dark_theme():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')
        
        # Enable dark mode by clicking theme toggle
        theme_toggle = page.locator('[data-theme-toggle]')
        if theme_toggle.count() > 0:
            theme_toggle.click()
            page.wait_for_timeout(500)
        
        # Go to settings page
        page.goto('http://localhost:3000/#/settings')
        page.wait_for_load_state('networkidle')
        page.screenshot(path='test-results/dark-theme-settings.png', full_page=True)
        print("✓ Settings page screenshot taken")
        
        # Go to models page
        page.goto('http://localhost:3000/#/models')
        page.wait_for_load_state('networkidle')
        page.screenshot(path='test-results/dark-theme-models.png', full_page=True)
        print("✓ Models page screenshot taken")
        
        # Check for text contrast issues by looking at computed styles
        labels = page.locator('label').all()
        print(f"✓ Found {len(labels)} labels")
        
        for i, label in enumerate(labels[:3]):
            computed = page.evaluate("""
                (element) => {
                    const styles = window.getComputedStyle(element);
                    return {
                        color: styles.color,
                        backgroundColor: styles.backgroundColor
                    };
                }
            """, label.element_handle())
            print(f"  Label {i}: {computed}")
        
        browser.close()
        print("\n✓ Dark theme test completed successfully!")

if __name__ == '__main__':
    test_dark_theme()
