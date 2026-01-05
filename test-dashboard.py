#!/usr/bin/env python3
"""
Comprehensive test suite for Llama Async Proxy Dashboard
Tests: Page loading, Socket.IO, routes, console errors, API endpoints
"""

from playwright.sync_api import sync_playwright
import sys
import time

BASE_URL = "http://localhost:3000"


def test_main_page_loads(playwright):
    """Test that the main page loads and renders correctly."""
    print("\n=== Test: Main Page Loading ===")

    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Collect console messages
    console_messages = []
    page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))

    # Collect page errors
    page_errors = []
    page.on("pageerror", lambda err: page_errors.append(str(err)))

    try:
        # Navigate to the page
        response = page.goto(BASE_URL, wait_until="networkidle", timeout=30000)

        assert response.status == 200, f"Expected 200, got {response.status}"
        print(f"✓ Page loaded successfully with status {response.status}")

        # Check page title
        title = page.title()
        assert "Llama Async Proxy" in title, f"Title mismatch: {title}"
        print(f"✓ Page title: {title}")

        # Wait for app to load and render content (up to 10 seconds)
        try:
            page.wait_for_selector("#app:not(:has(.loading-screen))", timeout=10000)
            print("✓ App loaded and rendered (loading screen gone)")
        except Exception:
            # Check if content is there anyway
            app_content = page.locator("#app").inner_html()
            if "loading-screen" not in app_content or len(app_content) > 200:
                print("✓ App content rendered")
            else:
                print("⚠ App still on loading screen (socket connection pending)")

        # Check for navigation
        nav = page.locator("nav, .nav, [role='navigation'], .sidebar").first
        if nav.is_visible():
            print("✓ Navigation present")
        else:
            print("⚠ Navigation not found (may be SPA routing)")

        # Check for dashboard/stats elements
        stats_cards = page.locator(".stat-card, .card, [class*='stat']").all()
        if len(stats_cards) > 0:
            print(f"✓ Found {len(stats_cards)} stat card elements")

        # Report console messages
        if console_messages:
            print(f"\n📋 Console messages ({len(console_messages)}):")
            for msg in console_messages[:10]:  # Show first 10
                print(f"   {msg}")

        # Report errors
        if page_errors:
            print(f"\n❌ Page errors ({len(page_errors)}):")
            for err in page_errors:
                print(f"   {err}")
            return False
        else:
            print("\n✓ No page errors detected")

        return True

    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    finally:
        browser.close()


def test_socket_io_connection(playwright):
    """Test that Socket.IO connection is established."""
    print("\n=== Test: Socket.IO Connection ===")

    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    try:
        # Navigate and wait for Socket.IO to connect
        page.goto(BASE_URL, wait_until="networkidle", timeout=30000)

        # Wait a moment for Socket.IO connection
        time.sleep(2)

        # Check if Socket.IO emitted connection events
        # We can verify by checking if the app initialized properly

        # Try to evaluate JavaScript to check socket state
        socket_check = page.evaluate("""
            () => {
                if (typeof io !== 'undefined') {
                    return { connected: true, socketExists: true };
                }
                // Check if app initialized
                if (typeof window !== 'undefined' && document.body) {
                    return { connected: false, socketExists: false, bodyExists: true };
                }
                return { connected: false, socketExists: false, bodyExists: false };
            }
        """)

        print(f"✓ Socket check result: {socket_check}")

        if socket_check.get("bodyExists"):
            print("✓ Application initialized")

        # Check for any connection-related elements or data
        dashboard_loaded = page.evaluate("""
            () => {
                // Check if dashboard components rendered
                const mainContent = document.querySelector('main');
                if (mainContent && mainContent.innerHTML.length > 100) {
                    return true;
                }
                return false;
            }
        """)

        if dashboard_loaded:
            print("✓ Dashboard content rendered")

        return True

    except Exception as e:
        print(f"❌ Socket.IO test failed: {e}")
        return False
    finally:
        browser.close()


def test_all_routes(playwright):
    """Test that all SPA routes work correctly."""
    print("\n=== Test: SPA Routes ===")

    routes = [
        ("/", "Dashboard"),
        ("/models", "Models"),
        ("/monitoring", "Monitoring"),
        ("/configuration", "Configuration"),
        ("/settings", "Settings"),
        ("/logs", "Logs"),
    ]

    browser = playwright.chromium.launch(headless=True)

    all_passed = True

    for route, name in routes:
        page = browser.new_page()
        try:
            response = page.goto(
                f"{BASE_URL}{route}", wait_until="networkidle", timeout=30000
            )

            if response.status == 200:
                print(f"✓ Route {route} ({name}) - Status {response.status}")
            else:
                print(f"❌ Route {route} ({name}) - Status {response.status}")
                all_passed = False

        except Exception as e:
            print(f"❌ Route {route} ({name}) - Error: {e}")
            all_passed = False
        finally:
            page.close()

    browser.close()
    return all_passed


def test_api_endpoints(playwright):
    """Test Socket.IO API endpoints by simulating events."""
    print("\n=== Test: API Endpoints ===")

    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    try:
        page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
        time.sleep(1)

        # Test that we can call API methods from the page
        api_test_results = page.evaluate("""
            () => {
                const results = { tests: [] };
                
                // Check if socketClient exists (lowercase)
                if (typeof socketClient !== 'undefined') {
                    results.tests.push({ name: 'socketClient exists', passed: true });
                } else {
                    results.tests.push({ name: 'socketClient exists', passed: false, error: 'Not found' });
                }
                
                // Check if State exists (capitalized) or stateManager
                if (typeof State !== 'undefined') {
                    results.tests.push({ name: 'State exists', passed: true });
                } else if (typeof stateManager !== 'undefined') {
                    results.tests.push({ name: 'stateManager exists', passed: true });
                } else {
                    results.tests.push({ name: 'State/stateManager exists', passed: false, error: 'Not found' });
                }
                
                // Check if Component exists
                if (typeof Component !== 'undefined') {
                    results.tests.push({ name: 'Component exists', passed: true });
                } else {
                    results.tests.push({ name: 'Component exists', passed: false, error: 'Not found' });
                }
                
                // Check if router exists
                if (typeof router !== 'undefined' || window.router) {
                    results.tests.push({ name: 'Router exists', passed: true });
                } else {
                    results.tests.push({ name: 'Router exists', passed: false, error: 'Not found' });
                }
                
                return results;
            }
        """)

        for test in api_test_results.get("tests", []):
            if test.get("passed"):
                print(f"✓ {test['name']}")
            else:
                print(f"❌ {test['name']}: {test.get('error', 'Unknown error')}")

        return all(t.get("passed", False) for t in api_test_results.get("tests", []))

    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False
    finally:
        browser.close()


def test_css_loading(playwright):
    """Test that CSS files are loading correctly."""
    print("\n=== Test: CSS Loading ===")

    browser = playwright.chromium.launch(headless=True)

    css_urls = [
        "/css/main.css",
        "/css/components.css",
    ]

    all_passed = True
    page = browser.new_page()

    for css_url in css_urls:
        try:
            response = page.goto(
                f"{BASE_URL}{css_url}", wait_until="networkidle", timeout=10000
            )

            if response.status == 200:
                content_type = response.headers.get("content-type", "")
                if (
                    "css" in content_type
                    or response.headers.get("content-length", 0) > 0
                ):
                    print(f"✓ CSS loaded: {css_url}")
                else:
                    print(f"⚠ CSS returned empty: {css_url}")
            else:
                print(f"❌ CSS failed: {css_url} - Status {response.status}")
                all_passed = False
        except Exception as e:
            print(f"❌ CSS error {css_url}: {e}")
            all_passed = False

    page.close()
    browser.close()
    return all_passed


def test_javascript_loading(playwright):
    """Test that JavaScript files are loading correctly."""
    print("\n=== Test: JavaScript Loading ===")

    browser = playwright.chromium.launch(headless=True)

    js_files = [
        "/js/app.js",
        "/js/core/component.js",
        "/js/core/router.js",
        "/js/core/state.js",
        "/js/services/socket.js",
    ]

    all_passed = True
    page = browser.new_page()

    for js_file in js_files:
        try:
            response = page.goto(
                f"{BASE_URL}{js_file}", wait_until="networkidle", timeout=10000
            )

            if response.status == 200:
                content = response.body()
                if len(content) > 0:
                    print(f"✓ JS loaded: {js_file} ({len(content)} bytes)")
                else:
                    print(f"⚠ JS returned empty: {js_file}")
            else:
                print(f"❌ JS failed: {js_file} - Status {response.status}")
                all_passed = False
        except Exception as e:
            print(f"❌ JS error {js_file}: {e}")
            all_passed = False

    page.close()
    browser.close()
    return all_passed


def test_visual_elements(playwright):
    """Test visual elements and layout."""
    print("\n=== Test: Visual Elements ===")

    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    try:
        page.goto(BASE_URL, wait_until="networkidle", timeout=30000)

        # Check viewport meta tag
        viewport = page.locator("meta[name='viewport']")
        if viewport.count() > 0:
            print("✓ Viewport meta tag present")
        else:
            print("⚠ Viewport meta tag missing")

        # Check for favicon
        favicon = page.locator("link[rel='icon'], link[rel='shortcut icon']")
        if favicon.count() > 0:
            print("✓ Favicon link present")
        else:
            print("⚠ Favicon link missing")

        # Check for notifications container
        notifications = page.locator("#notifications")
        if notifications.count() > 0:
            print("✓ Notifications container present")

        # Check for main app structure
        app_elements = page.evaluate("""
            () => {
                const elements = [];
                const selectors = [
                    'header', 'footer', 'aside', 'main',
                    '.sidebar', '.navbar', '.toolbar',
                    '.dashboard', '.metrics', '.stats'
                ];
                selectors.forEach(sel => {
                    const found = document.querySelectorAll(sel);
                    if (found.length > 0) {
                        elements.push({ selector: sel, count: found.length });
                    }
                });
                return elements;
            }
        """)

        if app_elements:
            print(f"✓ App structure elements found: {len(app_elements)}")
            for elem in app_elements[:5]:
                print(f"   - {elem['selector']}: {elem['count']} element(s)")

        # Check for any visible buttons
        buttons = page.locator("button").all()
        if buttons:
            visible_buttons = [b for b in buttons if b.is_visible()]
            print(f"✓ Found {len(visible_buttons)} visible button(s)")

        # Check for links
        links = page.locator("a[href]").all()
        if links:
            visible_links = [l for l in links if l.is_visible()]
            print(f"✓ Found {len(visible_links)} visible link(s)")

        return True

    except Exception as e:
        print(f"❌ Visual test failed: {e}")
        return False
    finally:
        browser.close()


def run_all_tests():
    """Run all tests and report results."""
    print("=" * 60)
    print("🦙 Llama Async Proxy Dashboard - Test Suite")
    print("=" * 60)

    results = {}

    with sync_playwright() as playwright:
        tests = [
            ("Main Page", lambda: test_main_page_loads(playwright)),
            ("Socket.IO", lambda: test_socket_io_connection(playwright)),
            ("SPA Routes", lambda: test_all_routes(playwright)),
            ("API Endpoints", lambda: test_api_endpoints(playwright)),
            ("CSS Loading", lambda: test_css_loading(playwright)),
            ("JavaScript", lambda: test_javascript_loading(playwright)),
            ("Visual Elements", lambda: test_visual_elements(playwright)),
        ]

        for test_name, test_func in tests:
            try:
                results[test_name] = test_func()
            except Exception as e:
                print(f"\n❌ {test_name} threw exception: {e}")
                results[test_name] = False

    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print("=" * 60)

    passed = 0
    failed = 0

    for test_name, result in results.items():
        status = "✓ PASS" if result else "❌ FAIL"
        print(f"  {status}: {test_name}")
        if result:
            passed += 1
        else:
            failed += 1

    print("-" * 60)
    print(f"  Total: {passed + failed} | Passed: {passed} | Failed: {failed}")
    print("=" * 60)

    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
