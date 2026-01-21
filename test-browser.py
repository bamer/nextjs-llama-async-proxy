#!/usr/bin/env python3
"""
Interactive browser test for Llama Proxy Dashboard
"""

from playwright.sync_api import sync_playwright
import sys


def test_full():
    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Visible browser
        page = browser.new_page()

        # Capture all console messages
        console_output = []

        def handle_console(msg):
            console_output.append(f"[{msg.type}] {msg.text}")
            if msg.type == "error":
                results.append(f"ERROR: {msg.text}")

        page.on("console", handle_console)

        # Test 1: Load dashboard
        print("=" * 60)
        print("TEST 1: Loading Dashboard")
        print("=" * 60)
        page.goto("http://localhost:3000")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)

        # Check page loaded
        title = page.title()
        print(f"Page title: {title}")

        # Check elements
        app = page.locator("#app")
        dashboard = page.locator(".dashboard-page")
        nav = page.locator("header")

        print(f"App container: {'✅' if app.count() > 0 else '❌'}")
        print(f"Dashboard: {'✅' if dashboard.count() > 0 else '❌'}")
        print(f"Header: {'✅' if nav.count() > 0 else '❌'}")

        if app.count() == 0:
            results.append("App container not found")

        # Test 2: Socket.IO connection
        print("\n" + "=" * 60)
        print("TEST 2: Socket.IO Connection")
        print("=" * 60)
        socket_works = page.evaluate("""() => {
            return typeof window.socketClient !== 'undefined' && 
                   window.socketClient.isConnected === true;
        }""")
        print(f"Socket.IO connected: {'✅' if socket_works else '❌'}")
        if not socket_works:
            results.append("Socket.IO not connected")

        # Test 3: Navigate to Models page
        print("\n" + "=" * 60)
        print("TEST 3: Navigate to Models Page")
        print("=" * 60)
        models_link = page.locator("a[href='/models']")
        if models_link.count() > 0:
            models_link.first.click()
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)

            models_page = page.locator(".models-page")
            print(f"Models page loaded: {'✅' if models_page.count() > 0 else '❌'}")

            # Check if models loaded
            models_loaded = page.evaluate("""() => {
                const el = document.querySelector('.models-page');
                return el && el.innerText.length > 0;
            }""")
            print(f"Models content visible: {'✅' if models_loaded else '❌'}")
        else:
            print("Models link not found")
            results.append("Models navigation link not found")

        # Test 4: Navigate back to Dashboard
        print("\n" + "=" * 60)
        print("TEST 4: Navigate back to Dashboard")
        print("=" * 60)
        dashboard_link = page.locator("a[href='/']")
        if dashboard_link.count() > 0:
            dashboard_link.first.click()
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)

            dashboard = page.locator(".dashboard-page")
            print(f"Back to Dashboard: {'✅' if dashboard.count() > 0 else '❌'}")
        else:
            print("Dashboard link not found")

        # Test 5: Check for router status card
        print("\n" + "=" * 60)
        print("TEST 5: Router Status Card")
        print("=" * 60)
        router_card = page.locator(".llama-router-status-card")
        print(f"Router card present: {'✅' if router_card.count() > 0 else '❌'}")

        # Check router status text
        status_text = page.locator(".badge-text").first.inner_text()
        print(f"Router status: {status_text}")

        # Test 6: Check all buttons work (no JS errors on click)
        print("\n" + "=" * 60)
        print("TEST 6: Button Interactions")
        print("=" * 60)
        buttons = page.locator("button").all()
        print(f"Total buttons on page: {len(buttons)}")

        # Try clicking a button (e.g., refresh if exists)
        refresh_btn = page.locator("[data-action='refresh']")
        if refresh_btn.count() > 0:
            refresh_btn.first.click()
            page.wait_for_timeout(1000)
            print("Refresh button clicked: ✅")
        else:
            print("Refresh button not found (may be normal)")

        # Take screenshot
        page.screenshot(path="/tmp/llama-dashboard-test.png", full_page=True)
        print("\n📸 Screenshot saved: /tmp/llama-dashboard-test.png")

        browser.close()

    # Final Results
    print("\n" + "=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)

    if results:
        print(f"❌ {len(results)} error(s):")
        for r in results:
            print(f"  - {r}")
        return 1
    else:
        print("✅ All tests passed!")
        print("✅ Application working correctly with Socket.IO!")
        return 0


if __name__ == "__main__":
    sys.exit(test_full())
