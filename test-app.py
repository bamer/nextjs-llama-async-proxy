#!/usr/bin/env python3
"""
Test the Llama Proxy Dashboard application with Playwright
"""

from playwright.sync_api import sync_playwright
import sys


def test_application():
    errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console errors
        def handle_console(msg):
            if msg.type == "error":
                errors.append(f"Console Error: {msg.text}")

        page.on("console", handle_console)

        # Navigate to the app
        print("Navigating to http://localhost:3000...")
        page.goto("http://localhost:3000")

        # Wait for the page to fully load
        page.wait_for_load_state("networkidle")
        print("Page loaded, waiting for app to initialize...")

        # Wait a bit for React/JS to fully initialize
        page.wait_for_timeout(3000)

        # Check if main elements exist
        print("Checking for main application elements...")

        # Check for app container
        app = page.locator("#app")
        if app.count() > 0:
            print("✅ App container found")
        else:
            errors.append("❌ App container #app not found")

        # Check for dashboard
        dashboard = page.locator(".dashboard-page, #dashboard")
        if dashboard.count() > 0:
            print("✅ Dashboard found")
        else:
            print("⚠️ Dashboard not found (may be on different page)")

        # Check for navigation
        nav = page.locator("nav, .nav, [role='navigation']")
        if nav.count() > 0:
            print("✅ Navigation found")
        else:
            print("⚠️ Navigation not found")

        # Take a screenshot for inspection
        page.screenshot(path="/tmp/app-screenshot.png", full_page=True)
        print("📸 Screenshot saved to /tmp/app-screenshot.png")

        # Print page content summary
        content = page.content()
        if "Dashboard" in content or "dashboard" in content.lower():
            print("✅ Dashboard text found in page")
        else:
            print("⚠️ Dashboard text not found in page")

        browser.close()

    # Report results
    print("\n" + "=" * 50)
    print("TEST RESULTS")
    print("=" * 50)

    if errors:
        print(f"❌ {len(errors)} error(s) found:")
        for error in errors:
            print(f"  - {error}")
        return 1
    else:
        print("✅ No console errors detected!")
        print("✅ Application loaded successfully!")
        return 0


if __name__ == "__main__":
    sys.exit(test_application())
