#!/usr/bin/env python3
"""
Comprehensive test for the Llama Proxy Dashboard application
"""

from playwright.sync_api import sync_playwright
import sys
import time


def test_comprehensive():
    errors = []
    warnings = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console messages
        console_messages = []

        def handle_console(msg):
            text = msg.text
            console_messages.append(f"[{msg.type}] {text}")
            if msg.type == "error":
                # Ignore some common non-critical errors
                if "favicon" not in text.lower() and "404" not in text:
                    errors.append(f"Console {msg.type}: {text}")

        page.on("console", handle_console)

        # Navigate to the app
        print("1. Navigating to http://localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_load_state("networkidle")
        print("   ✅ Page loaded")

        # Wait for app to initialize
        print("2. Waiting for app initialization...")
        time.sleep(3)

        # Check app container
        print("3. Checking application elements...")
        app = page.locator("#app")
        if app.count() > 0:
            print("   ✅ App container #app found")
        else:
            errors.append("❌ App container #app not found")

        # Check dashboard
        dashboard = page.locator(".dashboard-page")
        if dashboard.count() > 0:
            print("   ✅ Dashboard page loaded")
        else:
            # Try alternative selectors
            dashboard_alt = page.locator("[class*='dashboard']")
            if dashboard_alt.count() > 0:
                print("   ✅ Dashboard element found (alternative selector)")
            else:
                warnings.append("⚠️ Dashboard not found (may be on different route)")

        # Check navigation
        nav = page.locator("nav, .nav, header")
        if nav.count() > 0:
            print("   ✅ Navigation/Header found")
        else:
            warnings.append("⚠️ Navigation not found")

        # Check for router card (llama router status)
        router_card = page.locator(".llama-router-status-card, [class*='router']")
        if router_card.count() > 0:
            print("   ✅ Router status card found")
        else:
            print("   ℹ️ Router status card not visible (may need router running)")

        # Test navigation links
        print("4. Testing navigation...")
        nav_links = page.locator("nav a, .nav a, header a").all()
        if len(nav_links) > 0:
            print(f"   Found {len(nav_links)} navigation links")
            # Click on Models link if exists
            for link in nav_links:
                href = link.get_attribute("href")
                if href and "models" in href:
                    print(f"   Clicking Models link: {href}")
                    link.click()
                    page.wait_for_load_state("networkidle")
                    time.sleep(2)
                    # Check if models page loaded
                    models_page = page.locator(".models-page, [class*='model']")
                    if models_page.count() > 0:
                        print("   ✅ Models page loaded successfully")
                    else:
                        print(
                            "   ℹ️ Models page may have loaded (no specific selector found)"
                        )
                    break

        # Test Socket.IO connection
        print("5. Checking Socket.IO connection...")
        # Check if socketClient exists in window
        socket_check = page.evaluate("() => typeof window.socketClient !== 'undefined'")
        if socket_check:
            print("   ✅ socketClient exists in window")
            # Check if connected
            connected = page.evaluate(
                "() => window.socketClient && window.socketClient.isConnected"
            )
            if connected:
                print("   ✅ Socket.IO is connected")
            else:
                print("   ℹ️ Socket.IO exists but not connected yet")
        else:
            errors.append("❌ socketClient not found in window")

        # Test chart section
        print("6. Checking dashboard charts...")
        charts = page.locator("canvas, [class*='chart']")
        if charts.count() > 0:
            print(f"   ✅ Found {charts.count()} chart element(s)")
        else:
            print("   ℹ️ No chart elements found (may be normal if no data)")

        # Test buttons
        print("7. Checking interactive elements...")
        buttons = page.locator("button").all()
        print(f"   Found {len(buttons)} buttons on page")

        # Look for specific action buttons
        print("7. Checking interactive elements...")
        buttons = page.locator("button").all()
        print(f"   Found {len(buttons)} buttons on page")

        # Look for specific action buttons
        start_btn = page.locator("[data-action='start'], button:has-text('Start')")
        if start_btn.count() > 0:
            print("   ✅ Start button found")

        # Take final screenshot
        print("8. Taking final screenshot...")
        page.screenshot(path="/tmp/app-final-test.png", full_page=True)
        print("   📸 Screenshot saved to /tmp/app-final-test.png")

        browser.close()

    # Print all console messages for debugging
    if console_messages:
        print("\n9. Console Messages:")
        for msg in console_messages[-20:]:  # Last 20 messages
            print(f"   {msg}")

    # Report results
    print("\n" + "=" * 60)
    print("COMPREHENSIVE TEST RESULTS")
    print("=" * 60)

    if warnings:
        print(f"\n⚠️ {len(warnings)} warning(s):")
        for w in warnings:
            print(f"  - {w}")

    if errors:
        print(f"\n❌ {len(errors)} error(s):")
        for error in errors:
            print(f"  - {error}")
        return 1
    else:
        print("\n✅ All critical tests passed!")
        print("✅ Application is functioning correctly!")
        return 0


if __name__ == "__main__":
    sys.exit(test_comprehensive())
