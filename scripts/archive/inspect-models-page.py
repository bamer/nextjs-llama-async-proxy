#!/usr/bin/env python3
"""
Simple reconnaissance script to inspect models page
"""

from playwright.sync_api import sync_playwright
import time


def inspect_page():
    """Take snapshots of the models page to understand its structure"""
    with sync_playwright() as p:
        print("🎭 Launching browser...")
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        print("📝 Navigating to http://localhost:3000/models")
        page.goto("http://localhost:3000/models")
        page.wait_for_load_state("networkidle")
        time.sleep(3)

        print("📸 Taking screenshot...")
        page.screenshot(path="test-screenshot.png", full_page=True)

        print("🔍 Getting page content...")
        content = page.content()

        print("📊 Counting buttons...")
        buttons = page.locator("button").all()
        print(f"   Total buttons found: {len(buttons)}")

        print("📊 Counting cards...")
        cards = page.locator('[class*="MuiCard-root"]').all()
        print(f"   Total cards found: {len(cards)}")

        print("\n🔍 Looking for model names...")
        headings = page.locator("h6").all()
        for i, heading in enumerate(headings[:5]):
            text = heading.inner_text()
            if text:
                print(f"   {i + 1}. {text[:50]}")

        print("\n🔍 Looking for buttons with 'config' text...")
        config_buttons = page.locator("button").filter(has_text="config").all()
        print(f"   Found {len(config_buttons)} config button(s)")

        if len(config_buttons) > 0:
            print("\n📝 First config button text:")
            print(f"   {config_buttons[0].inner_text()}")

        print("\n✅ Reconnaissance complete!")
        print(f"   Screenshot saved to: test-screenshot.png")

        browser.close()


if __name__ == "__main__":
    inspect_page()
