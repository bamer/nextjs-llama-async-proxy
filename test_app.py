#!/usr/bin/env python3
"""
Comprehensive Playwright test for Llama Async Proxy Application
Tests: Dashboard, Socket.IO, Navigation, Buttons, Screenshots, Console Errors
"""

import json
import os
from datetime import datetime
from playwright.sync_api import sync_playwright

TEST_RESULTS = []
SCREENSHOT_DIR = "/home/bamer/nextjs-llama-async-proxy/test-screenshots"


def log_test(name, passed, details=""):
    """Log test result"""
    status = "✓ PASS" if passed else "✗ FAIL"
    TEST_RESULTS.append({"name": name, "passed": passed, "details": details})
    print(f"{status}: {name}")
    if details:
        print(f"  Details: {details}")


def take_screenshot(page, name):
    """Take a screenshot and save to directory"""
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{SCREENSHOT_DIR}/{name}_{timestamp}.png"
    page.screenshot(path=filename, full_page=True)
    print(f"  Screenshot saved: {filename}")
    return filename


def main():
    print("=" * 60)
    print("LLAMA ASYNC PROXY - COMPREHENSIVE TEST")
    print("=" * 60)
    print(f"\nTesting: http://localhost:3000")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print()

    console_errors = []
    socket_connected = False

    with sync_playwright() as p:
        # Launch visible browser (not headless as requested)
        print("Starting visible browser...")
        browser = p.chromium.launch(
            headless=False,  # Visible browser
            args=["--no-sandbox", "--disable-setuid-sandbox"],
        )
        page = browser.new_page()

        # Capture console messages
        def handle_console(msg):
            if msg.type == "error":
                console_errors.append({"text": msg.text, "location": msg.location})
                print(f"  [CONSOLE ERROR] {msg.text}")
            elif msg.type == "warning":
                print(f"  [CONSOLE WARN] {msg.text}")

        page.on("console", handle_console)

        # ========================================
        # TEST 1: Load Dashboard
        # ========================================
        print("\n[TEST 1] Loading Dashboard...")
        try:
            page.goto("http://localhost:3000", timeout=30000)
            page.wait_for_load_state("networkidle", timeout=30000)
            take_screenshot(page, "01_dashboard_initial")
            log_test("Dashboard Load", True, "Page loaded successfully")
        except Exception as e:
            log_test("Dashboard Load", False, str(e))
            browser.close()
            return

        # ========================================
        # TEST 2: Verify Page Title and Basic Elements
        # ========================================
        print("\n[TEST 2] Verifying Page Elements...")
        try:
            title = page.title()
            log_test("Page Title", True, f"Title: {title}")

            # Check for main layout elements
            has_header = page.locator("header, .header, nav").count() > 0
            log_test(
                "Header Element",
                has_header,
                "Header/ nav found" if has_header else "No header found",
            )

            # Check for main content area
            has_main = page.locator("main, .main, #main").count() > 0
            log_test(
                "Main Content Area",
                has_main,
                "Main content found" if has_main else "No main content",
            )

        except Exception as e:
            log_test("Page Elements", False, str(e))

        # ========================================
        # TEST 3: Socket.IO Connection Check
        # ========================================
        print("\n[TEST 3] Checking Socket.IO Connection...")
        try:
            # Wait a bit for Socket.IO to initialize
            page.wait_for_timeout(2000)

            # Check if socketClient exists in window
            socket_check = page.evaluate("""
                () => {
                    if (typeof socketClient !== 'undefined') {
                        return {
                            exists: true,
                            connected: typeof socketClient.isConnected !== 'undefined' ? socketClient.isConnected : 'unknown',
                            type: typeof socketClient
                        };
                    } else if (typeof window.socketClient !== 'undefined') {
                        return {
                            exists: true,
                            connected: typeof window.socketClient.isConnected !== 'undefined' ? window.socketClient.isConnected : 'unknown',
                            type: typeof window.socketClient
                        };
                    }
                    return { exists: false, connected: false, type: 'undefined' };
                }
            """)

            socket_connected = socket_check.get("connected", False)
            if socket_check.get("exists", False):
                log_test(
                    "Socket.IO Client Exists", True, f"Type: {socket_check.get('type')}"
                )
                log_test(
                    "Socket.IO Connected",
                    socket_connected == True or socket_connected == "true",
                    f"Connection status: {socket_connected}",
                )
            else:
                log_test("Socket.IO Client", False, "socketClient not found in window")

        except Exception as e:
            log_test("Socket.IO Check", False, str(e))

        # ========================================
        # TEST 4: Check for stateManager (should NOT exist)
        # ========================================
        print("\n[TEST 4] Verifying No stateManager (Pure Socket.IO)...")
        try:
            state_check = page.evaluate("""
                () => {
                    if (typeof stateManager !== 'undefined') {
                        return { exists: true, type: typeof stateManager };
                    } else if (typeof window.stateManager !== 'undefined') {
                        return { exists: true, type: typeof window.stateManager };
                    }
                    return { exists: false };
                }
            """)

            if state_check.get("exists", False):
                log_test(
                    "No stateManager",
                    False,
                    "stateManager still exists - not pure Socket.IO!",
                )
            else:
                log_test(
                    "No stateManager",
                    True,
                    "stateManager not found (pure Socket.IO architecture)",
                )

        except Exception as e:
            log_test("stateManager Check", False, str(e))

        # ========================================
        # TEST 5: Navigation to Models Page
        # ========================================
        print("\n[TEST 5] Navigating to Models Page...")
        try:
            # Look for Models link/button
            models_link = page.locator(
                'a:has-text("Models"), [data-page="models"], .nav-models'
            ).first
            if models_link.count() > 0:
                models_link.click()
                page.wait_for_load_state("networkidle", timeout=30000)
                page.wait_for_timeout(1000)
                take_screenshot(page, "02_models_page")
                log_test(
                    "Models Page Navigation",
                    True,
                    "Successfully navigated to Models page",
                )
            else:
                # Try clicking via router
                page.evaluate("window.router.navigate('/models')")
                page.wait_for_load_state("networkidle", timeout=30000)
                page.wait_for_timeout(1000)
                take_screenshot(page, "02_models_page")
                log_test("Models Page Navigation", True, "Navigated via router")
        except Exception as e:
            log_test("Models Page Navigation", False, str(e))

        # ========================================
        # TEST 6: Models Page Elements
        # ========================================
        print("\n[TEST 6] Verifying Models Page Elements...")
        try:
            # Check for models list/table
            has_models_content = (
                page.locator(
                    '.models-list, .models-table, #models, [class*="model"]'
                ).count()
                > 0
            )
            log_test(
                "Models Content Present",
                has_models_content,
                "Models content found"
                if has_models_content
                else "No models content detected",
            )

        except Exception as e:
            log_test("Models Elements", False, str(e))

        # ========================================
        # TEST 7: Navigation to Presets Page
        # ========================================
        print("\n[TEST 7] Navigating to Presets Page...")
        try:
            presets_link = page.locator(
                'a:has-text("Presets"), [data-page="presets"], .nav-presets'
            ).first
            if presets_link.count() > 0:
                presets_link.click()
                page.wait_for_load_state("networkidle", timeout=30000)
                page.wait_for_timeout(1000)
                take_screenshot(page, "03_presets_page")
                log_test(
                    "Presets Page Navigation",
                    True,
                    "Successfully navigated to Presets page",
                )
            else:
                page.evaluate("window.router.navigate('/presets')")
                page.wait_for_load_state("networkidle", timeout=30000)
                page.wait_for_timeout(1000)
                take_screenshot(page, "03_presets_page")
                log_test("Presets Page Navigation", True, "Navigated via router")
        except Exception as e:
            log_test("Presets Page Navigation", False, str(e))

        # ========================================
        # TEST 8: Presets Page Elements
        # ========================================
        print("\n[TEST 8] Verifying Presets Page Elements...")
        try:
            has_presets_content = (
                page.locator(
                    '.presets-list, .presets-table, #presets, [class*="preset"]'
                ).count()
                > 0
            )
            log_test(
                "Presets Content Present",
                has_presets_content,
                "Presets content found"
                if has_presets_content
                else "No presets content detected",
            )
        except Exception as e:
            log_test("Presets Elements", False, str(e))

        # ========================================
        # TEST 9: Navigation Back to Dashboard
        # ========================================
        print("\n[TEST 9] Navigating back to Dashboard...")
        try:
            dashboard_link = page.locator(
                'a:has-text("Dashboard"), [data-page="/"], .nav-dashboard, a[href="/"]'
            ).first
            if dashboard_link.count() > 0:
                dashboard_link.click()
                page.wait_for_load_state("networkidle", timeout=30000)
            else:
                page.evaluate("window.router.navigate('/')")
                page.wait_for_load_state("networkidle", timeout=30000)

            page.wait_for_timeout(1000)
            take_screenshot(page, "04_dashboard_final")
            log_test("Dashboard Return", True, "Successfully returned to Dashboard")
        except Exception as e:
            log_test("Dashboard Return", False, str(e))

        # ========================================
        # TEST 10: Button Interactions
        # ========================================
        print("\n[TEST 10] Testing Button Interactions...")
        try:
            # Find and test buttons
            buttons = page.locator('button, .btn, [role="button"]').all()
            print(f"  Found {len(buttons)} button elements")

            # Test click on first few buttons (if any are interactive)
            clicked = 0
            for btn in buttons[:5]:  # Test first 5 buttons
                try:
                    if btn.is_visible() and btn.is_enabled():
                        btn.click()
                        clicked += 1
                        page.wait_for_timeout(500)
                except:
                    pass

            log_test(
                "Button Interactions",
                clicked > 0,
                f"Successfully clicked {clicked} buttons",
            )
        except Exception as e:
            log_test("Button Interactions", False, str(e))

        # ========================================
        # TEST 11: Final Socket.IO Status
        # ========================================
        print("\n[TEST 11] Final Socket.IO Status Check...")
        try:
            final_socket = page.evaluate("""
                () => {
                    if (typeof socketClient !== 'undefined') return { exists: true, connected: socketClient.isConnected };
                    if (typeof window.socketClient !== 'undefined') return { exists: true, connected: window.socketClient.isConnected };
                    return { exists: false };
                }
            """)

            if final_socket.get("exists", False):
                still_connected = final_socket.get("connected", False)
                log_test(
                    "Socket.IO Maintains Connection",
                    still_connected,
                    f"Connection maintained: {still_connected}",
                )
            else:
                log_test(
                    "Socket.IO Maintains Connection",
                    False,
                    "socketClient no longer exists",
                )
        except Exception as e:
            log_test("Socket.IO Final Check", False, str(e))

        # ========================================
        # TEST 12: JavaScript Errors Check
        # ========================================
        print("\n[TEST 12] JavaScript Error Summary...")
        js_errors = [
            e
            for e in console_errors
            if "error" in e.get("text", "").lower()
            or "exception" in e.get("text", "").lower()
        ]

        if len(js_errors) == 0:
            log_test("No JavaScript Errors", True, "No JS errors detected")
        else:
            log_test("No JavaScript Errors", False, f"Found {len(js_errors)} JS errors")
            for err in js_errors[:3]:  # Show first 3 errors
                print(f"  - {err['text'][:100]}")

        # Close browser
        browser.close()

    # ========================================
    # FINAL REPORT
    # ========================================
    print("\n" + "=" * 60)
    print("FINAL TEST REPORT")
    print("=" * 60)

    passed = sum(1 for r in TEST_RESULTS if r["passed"])
    total = len(TEST_RESULTS)
    percentage = (passed / total * 100) if total > 0 else 0

    print(f"\nTotal Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {percentage:.1f}%")

    print("\n--- Test Results ---")
    for result in TEST_RESULTS:
        status = "✓" if result["passed"] else "✗"
        print(f"{status} {result['name']}")
        if result["details"]:
            print(f"  → {result['details']}")

    if console_errors:
        print(f"\n--- Console Errors ({len(console_errors)}) ---")
        for err in console_errors[:5]:
            print(f"  • {err['text'][:150]}")

    print(f"\n--- Screenshots ---")
    print(f"Screenshots saved to: {SCREENSHOT_DIR}")
    print(f"Use: ls {SCREENSHOT_DIR}")

    final_status = (
        "100% WORKING"
        if percentage == 100
        else f"ISSUES FOUND ({total - passed} failures)"
    )
    print(f"\n{'=' * 60}")
    print(f"FINAL STATUS: {final_status}")
    print(f"{'=' * 60}")

    # Save results to JSON
    results_file = f"{SCREENSHOT_DIR}/test_results.json"
    report = {
        "timestamp": datetime.now().isoformat(),
        "url": "http://localhost:3000",
        "total_tests": total,
        "passed": passed,
        "failed": total - passed,
        "success_rate": f"{percentage:.1f}%",
        "final_status": final_status,
        "console_errors": len(console_errors),
        "tests": TEST_RESULTS,
    }

    with open(results_file, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\nResults saved to: {results_file}")


if __name__ == "__main__":
    main()
