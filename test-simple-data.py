#!/usr/bin/env python3
"""
Simple data loading test for Llama Async Proxy
"""

from playwright.sync_api import sync_playwright
import sys


def test_all_data_loading():
    all_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        # Capture all console messages
        console_output = []

        def handle_console(msg):
            text = msg.text
            if msg.type == "error" and "favicon" not in text.lower():
                all_errors.append(f"Console Error: {text}")
            console_output.append(f"[{msg.type}] {text}")

        page.on("console", handle_console)

        print("=" * 70)
        print("TESTING DATA LOADING - Llama Async Proxy")
        print("=" * 70)

        # ===== TEST 1: DASHBOARD =====
        print("\n[TEST 1] Loading Dashboard...")
        page.goto("http://localhost:3000")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(3000)

        # Check Socket.IO connection
        socket_connected = page.evaluate("() => window.socketClient?.isConnected")
        print(f"   Socket.IO connected: {'YES' if socket_connected else 'NO'}")

        # Check stats grid
        stats_text = page.evaluate(
            '() => document.querySelector(".stats-grid")?.innerText || ""'
        )
        print(f"   Stats Grid has data: {'YES' if len(stats_text) > 10 else 'NO'}")
        print(f"   Stats content: {stats_text[:100]}...")

        # Check router card
        router_text = page.evaluate(
            '() => document.querySelector(".llama-router-status-card")?.innerText || ""'
        )
        print(f"   Router Card: {router_text[:80]}...")

        # ===== TEST 2: MODELS PAGE =====
        print("\n[TEST 2] Loading Models page...")
        page.goto("http://localhost:3000/models")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(3000)

        models_text = page.evaluate(
            '() => document.querySelector(".models-page")?.innerText || ""'
        )
        print(f"   Models page loaded: {'YES' if len(models_text) > 10 else 'NO'}")
        print(f"   Content: {models_text[:100]}...")

        # ===== TEST 3: PRESETS PAGE =====
        print("\n[TEST 3] Loading Presets page...")
        page.goto("http://localhost:3000/presets")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(3000)

        presets_text = page.evaluate(
            '() => document.querySelector(".presets-page")?.innerText || ""'
        )
        print(f"   Presets page loaded: {'YES' if len(presets_text) > 10 else 'NO'}")
        print(f"   Content: {presets_text[:100]}...")

        # ===== TEST 4: LOGS PAGE =====
        print("\n[TEST 4] Loading Logs page...")
        page.goto("http://localhost:3000/logs")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(3000)

        logs_text = page.evaluate(
            '() => document.querySelector(".logs-page")?.innerText || ""'
        )
        print(f"   Logs page loaded: {'YES' if len(logs_text) > 10 else 'NO'}")
        print(f"   Content: {logs_text[:100]}...")

        # ===== TEST 5: SETTINGS PAGE =====
        print("\n[TEST 5] Loading Settings page...")
        page.goto("http://localhost:3000/settings")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(3000)

        settings_text = page.evaluate(
            '() => document.querySelector(".settings-page")?.innerText || ""'
        )
        print(f"   Settings page loaded: {'YES' if len(settings_text) > 10 else 'NO'}")
        print(f"   Content: {settings_text[:100]}...")

        # ===== TEST 6: Direct socket requests =====
        print("\n[TEST 6] Testing direct socket requests...")

        # Test config:get
        config_result = page.evaluate("""async () => {
            try {
                const response = await window.socketClient.request("config:get", {});
                return {success: response.success, hasConfig: !!response.data?.config, configKeys: response.data?.config ? Object.keys(response.data.config).join(",") : "none"};
            } catch (e) {
                return {error: e.message};
            }
        }""")
        print(f"   config:get: {config_result}")

        # Test presets:list
        presets_result = page.evaluate("""async () => {
            try {
                const response = await window.socketClient.request("presets:list", {});
                return {success: response.success, hasPresets: !!response.data?.presets, count: response.data?.presets?.length || 0};
            } catch (e) {
                return {error: e.message};
            }
        }""")
        print(f"   presets:list: {presets_result}")

        # Test logs:get
        logs_result = page.evaluate("""async () => {
            try {
                const response = await window.socketClient.request("logs:get", {});
                return {success: response.success, hasLogs: !!response.data?.logs, count: response.data?.logs?.length || 0};
            } catch (e) {
                return {error: e.message};
            }
        }""")
        print(f"   logs:get: {logs_result}")

        # Test models:list
        models_result = page.evaluate("""async () => {
            try {
                const response = await window.socketClient.request("models:list", {});
                return {success: response.success, hasModels: Array.isArray(response.data), count: response.data?.length || 0};
            } catch (e) {
                return {error: e.message};
            }
        }""")
        print(f"   models:list: {models_result}")

        # Test metrics:get
        metrics_result = page.evaluate("""async () => {
            try {
                const response = await window.socketClient.request("metrics:get", {});
                return {success: response.success, hasData: !!response.data, cpu: response.data?.cpu?.usage};
            } catch (e) {
                return {error: e.message};
            }
        }""")
        print(f"   metrics:get: {metrics_result}")

        # Print relevant console logs
        print("\n[CONSOLE LOGS - Relevant lines]")
        for msg in console_output[-50:]:
            if any(
                x in msg.lower()
                for x in [
                    "socketclient",
                    "request",
                    "loaded",
                    "error",
                    "debug",
                    "presets",
                    "metrics",
                    "config",
                    "logs",
                ]
            ):
                print(f"   {msg}")

        context.close()
        browser.close()

    # Final Results
    print("\n" + "=" * 70)
    print("FINAL RESULTS")
    print("=" * 70)

    if all_errors:
        print(f"\nConsole Errors ({len(all_errors)}):")
        for e in all_errors[:10]:
            print(f"   - {e}")
        return 1
    else:
        print("\nNo console errors detected!")
        return 0


if __name__ == "__main__":
    sys.exit(test_all_data_loading())
