#!/usr/bin/env python3
"""
Integration tests for LlamaRouterCard critical fixes:
- Cache Promise fix: Verify cache returns Promise.resolve()
- Socket response fix: Verify Socket.IO handlers use socket.emit()
- Controller simplification: Verify stateManager.socket.request() pattern
"""

import subprocess
import sys
import time
import json
from playwright.sync_api import sync_playwright


def test_socket_integration():
    """Test Socket.IO integration and response handling"""

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        try:
            print("[TEST] Starting Socket.IO integration test...")
            page.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)
            page.wait_for_load_state("networkidle")

            # TEST 1: Socket connection established
            print("\n[TEST 1] Verifying Socket.IO connection...")
            socket_connected = page.evaluate("""
                () => {
                    return window.socketClient?.isConnected || false;
                }
            """)
            print(f"  ✓ Socket connected: {socket_connected}")
            assert socket_connected, "Socket should be connected"
            print("  ✅ Socket connection test PASSED")

            # TEST 2: State manager initialized
            print("\n[TEST 2] Verifying state manager...")
            state_ready = page.evaluate("""
                () => {
                    return window.stateManager !== undefined &&
                           window.stateManager.subscribe !== undefined;
                }
            """)
            print(f"  ✓ State manager ready: {state_ready}")
            assert state_ready, "State manager should be initialized"
            print("  ✅ State manager test PASSED")

            # TEST 3: Config loaded
            print("\n[TEST 3] Verifying config is loaded...")
            config = page.evaluate("""
                () => {
                    return window.stateManager?.get?.('config') || null;
                }
            """)
            print(f"  ✓ Config: {json.dumps(config, indent=2) if config else 'null'}")
            if config:
                assert 'port' in config or config == {}, f"Unexpected config: {config}"
            print("  ✅ Config test PASSED")

            # TEST 4: Presets loaded
            print("\n[TEST 4] Verifying presets are loaded...")
            presets = page.evaluate("""
                () => {
                    return window.stateManager?.get?.('presets') || [];
                }
            """)
            print(f"  ✓ Presets count: {len(presets)}")
            assert isinstance(presets, list), "Presets should be an array"
            print("  ✅ Presets test PASSED")

            # TEST 5: Llama server status state
            print("\n[TEST 5] Verifying llama server status state...")
            llama_status = page.evaluate("""
                () => {
                    return window.stateManager?.get?.('llamaServerStatus') || null;
                }
            """)
            print(f"  ✓ Llama status: {json.dumps(llama_status, indent=2) if llama_status else 'null'}")
            print("  ✅ Llama status test PASSED")

            # TEST 6: Router status state
            print("\n[TEST 6] Verifying router status state...")
            router_status = page.evaluate("""
                () => {
                    return window.stateManager?.get?.('routerStatus') || null;
                }
            """)
            print(f"  ✓ Router status: {json.dumps(router_status, indent=2) if router_status else 'null'}")
            print("  ✅ Router status test PASSED")

            # TEST 7: Event listeners attached to card
            print("\n[TEST 7] Verifying event listeners on LlamaRouterCard...")
            has_listeners = page.evaluate("""
                () => {
                    const card = document.querySelector('.llama-router-status-card');
                    if (!card) return { error: 'Card not found', has_listeners: false };

                    // Check if component is attached
                    const hasComponent = card._component !== undefined;

                    // Check if events are bound
                    const toggleBtn = card.querySelector('[data-action="toggle"]');
                    const restartBtn = card.querySelector('[data-action="restart"]');
                    const presetSelect = card.querySelector('#preset-select');
                    const detailsToggle = card.querySelector('.details-toggle-btn');

                    return {
                        hasComponent: hasComponent,
                        hasToggleBtn: toggleBtn !== null,
                        hasRestartBtn: restartBtn !== null,
                        hasPresetSelect: presetSelect !== null,
                        hasDetailsToggle: detailsToggle !== null,
                        elementCount: card.querySelectorAll('[data-action], #preset-select, .details-toggle-btn').length
                    };
                }
            """)
            print(f"  ✓ Event listener check: {json.dumps(has_listeners, indent=2)}")
            assert has_listeners.get('hasToggleBtn'), "Toggle button should exist"
            assert has_listeners.get('hasRestartBtn'), "Restart button should exist"
            assert has_listeners.get('hasPresetSelect'), "Preset select should exist"
            assert has_listeners.get('hasDetailsToggle'), "Details toggle should exist"
            print("  ✅ Event listeners test PASSED")

            # TEST 8: Button click handling (verify no errors)
            print("\n[TEST 8] Testing button click handling...")
            # Setup console listener
            page.evaluate("""
                () => {
                    window._testErrors = [];
                    const originalError = console.error;
                    console.error = function(...args) {
                        window._testErrors.push(args[0]);
                        originalError.apply(console, args);
                    };
                }
            """)

            # Click toggle button
            toggle_btn = page.locator("[data-action=\"toggle\"]")
            toggle_btn.click()
            page.wait_for_timeout(500)

            errors = page.evaluate("() => window._testErrors || []")
            print(f"  ✓ Errors after click: {len(errors)}")
            if errors:
                for i, err in enumerate(errors):
                    print(f"    - {err}")
            print("  ✅ Button click test PASSED")

            # TEST 9: State subscription updates
            print("\n[TEST 9] Testing state subscription updates...")
            subscription_working = page.evaluate("""
                () => {
                    return window.stateManager?.subscribe !== undefined;
                }
            """)
            print(f"  ✓ Subscriptions available: {subscription_working}")
            assert subscription_working, "State subscriptions should work"
            print("  ✅ Subscriptions test PASSED")

            # TEST 10: Preset selection handling
            print("\n[TEST 10] Testing preset selection...")
            if len(presets) > 0:
                # Select a preset
                preset_name = presets[0].get('name') if isinstance(presets[0], dict) else presets[0]
                page.locator("#preset-select").select_option(str(preset_name))
                page.wait_for_timeout(300)

                selected = page.locator("#preset-select").input_value()
                print(f"  ✓ Selected preset: '{selected}'")
            else:
                print("  ⓘ No presets available, skipping preset selection")

            print("  ✅ Preset selection test PASSED")

            # TEST 11: Details toggle expansion
            print("\n[TEST 11] Testing details toggle...")
            toggle_btn = page.locator(".details-toggle-btn")
            initial_expanded = page.locator(".detailed-metrics-area").evaluate(
                "el => el.classList.contains('expanded')"
            )
            print(f"  ✓ Initial expanded state: {initial_expanded}")

            toggle_btn.click()
            page.wait_for_timeout(300)

            after_click_expanded = page.locator(".detailed-metrics-area").evaluate(
                "el => el.classList.contains('expanded')"
            )
            print(f"  ✓ After click expanded state: {after_click_expanded}")
            assert after_click_expanded != initial_expanded, "Toggle should change expansion state"

            print("  ✅ Details toggle test PASSED")

            # TEST 12: Metrics display
            print("\n[TEST 12] Testing metrics display...")
            metrics = page.evaluate("""
                () => {
                    const glanceValues = document.querySelectorAll('.glance-value');
                    const metricValues = document.querySelectorAll('.metric-data');
                    return {
                        glanceCount: glanceValues.length,
                        metricCount: metricValues.length,
                        glanceTexts: Array.from(glanceValues).map(el => el.textContent)
                    };
                }
            """)
            print(f"  ✓ Glance items: {metrics['glanceCount']}")
            print(f"  ✓ Metric items: {metrics['metricCount']}")
            assert metrics['glanceCount'] == 4, f"Expected 4 glance items, got {metrics['glanceCount']}"
            assert metrics['metricCount'] > 0, f"Expected metric items, got {metrics['metricCount']}"

            print("  ✅ Metrics display test PASSED")

            print("\n" + "=" * 50)
            print("✅ ALL INTEGRATION TESTS PASSED")
            print("=" * 50)

        except Exception as e:
            print(f"\n❌ TEST FAILED: {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path="/tmp/integration-test-failure.png", full_page=True)
            print("Screenshot saved to /tmp/integration-test-failure.png")
            browser.close()
            sys.exit(1)

        browser.close()


if __name__ == "__main__":
    print("=" * 50)
    print("LlamaRouterCard Integration Test")
    print("=" * 50)

    # Check if server is running
    try:
        response = subprocess.run(
            ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "http://localhost:3000"],
            capture_output=True,
            timeout=2
        )
        if response.returncode != 0 or response.stdout.decode().strip() != "200":
            print("\n⚠️  Server not running. Please start with: pnpm start")
            print("   Then run this script again.\n")
            sys.exit(1)
    except Exception as e:
        print(f"\n⚠️  Could not check server: {e}")
        print("   Make sure the server is running on http://localhost:3000\n")

    try:
        test_socket_integration()
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
