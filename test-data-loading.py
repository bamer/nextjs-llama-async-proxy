#!/usr/bin/env python3
"""
Comprehensive data loading test for Llama Async Proxy
"""
from playwright.sync_api import sync_playwright
import sys

def test_all_data_loading():
    all_errors = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={'width': 1400, 'height': 900})
        page = context.new_page()
        
        # Capture all console messages
        console_output = []
        def handle_console(msg):
            text = msg.text
            if msg.type == 'error' and 'favicon' not in text.lower():
                all_errors.append(f"Console Error: {text}")
            console_output.append(f"[{msg.type}] {text}")
        
        page.on("console", handle_console)
        
        print("="*70)
        print("TESTING DATA LOADING - Llama Async Proxy")
        print("="*70)
        
        # ===== TEST 1: DASHBOARD =====
        print("\n[TEST 1] Loading Dashboard...")
        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(3000)
        
        # Check Socket.IO connection
        socket_connected = page.evaluate('() => window.socketClient?.isConnected')
        print(f"   Socket.IO connected: {'✅' if socket_connected else '❌'}")
        
        # Check what data loaded
        metrics = page.evaluate('() => document.querySelector(".stats-grid")?.innerText?.length > 0')
        router_status = page.evaluate('() => document.querySelector(".llama-router-status-card")?.innerText?.includes("STOPPED")')
        charts = page.evaluate('() => document.querySelector(".charts-section")?.innerText?.length > 0')
        system_health = page.evaluate('() => document.querySelector(".system-health")?.innerText?.length > 0')
        
        print(f"   Stats Grid loaded: {'✅' if metrics else '❌'}")
        print(f"   Router Card loaded: {'✅' if router_status else '❌'}")
        print(f"   Charts Section: {'✅' if charts else '❌'}")
        print(f"   System Health: {'✅' if system_health else '❌'}")
        
        # ===== TEST 2: MODELS PAGE =====
        print("\n[TEST 2] Loading Models page...")
        page.goto('http://localhost:3000/models')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(3000)
        
        models_loaded = page.evaluate('() => {
            const table = document.querySelector(".models-table, table");
            if (!table) return {found: false};
            const rows = table.querySelectorAll("tbody tr, .model-row");
            return {found: true, count: rows.length, text: table.innerText.substring(0, 200)};
        }')
        
        if models_loaded.get('found'):
            print(f"   Models table: ✅ ({models_loaded.get('count')} models)")
        else:
            print(f"   Models table: ❌")
        
        # ===== TEST 3: PRESETS PAGE =====
        print("\n[TEST 3] Loading Presets page...")
        page.goto('http://localhost:3000/presets')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(3000)
        
        presets_loaded = page.evaluate('() => {
            const presets = document.querySelectorAll(".preset-item, .preset-card, [class*='preset']");
            const text = document.querySelector(".presets-page")?.innerText || "";
            return {count: presets.length, hasText: text.length > 0};
        }')
        
        print(f"   Presets content: {'✅' if presets_loaded.get('hasText') else '❌'}")
        print(f"   Preset items: {presets_loaded.get('count')}")
        
        # ===== TEST 4: LOGS PAGE =====
        print("\n[TEST 4] Loading Logs page...")
        page.goto('http://localhost:3000/logs')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(3000)
        
        logs_loaded = page.evaluate('() => {
            const container = document.querySelector(".logs-container, .logs-list");
            if (!container) return {found: false};
            const logs = container.querySelectorAll(".log-entry, .log-item");
            const text = container.innerText || "";
            return {found: true, count: logs.length, text: text.substring(0, 200)};
        }')
        
        if logs_loaded.get('found'):
            print(f"   Logs container: ✅ ({logs_loaded.get('count')} entries)")
        else:
            print(f"   Logs container: ❌")
        
        # ===== TEST 5: SETTINGS PAGE =====
        print("\n[TEST 5] Loading Settings page...")
        page.goto('http://localhost:3000/settings')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(3000)
        
        settings_loaded = page.evaluate('() => {
            const inputs = document.querySelectorAll("input[type='text'], input[type='number'], select");
            const checked = document.querySelectorAll("input[type='checkbox']:checked");
            return {inputs: inputs.length, checked: checked.length};
        }')
        
        print(f"   Settings inputs: {settings_loaded.get('inputs')}")
        print(f"   Checked options: {settings_loaded.get('checked')}")
        
        # Check if values are populated
        host_value = page.evaluate('() => {
            const host = document.querySelector("input[placeholder*='0.0.0.0']")?.value;
            return host || "empty";
        }')
        print(f"   Host value: {host_value}")
        
        port_value = page.evaluate('() => {
            const port = document.querySelector("input[type='number']")?.value;
            return port || "empty";
        }')
        print(f"   Port value: {port_value}")
        
        # ===== CHECK SOCKET REQUESTS =====
        print("\n[TEST 6] Checking socket request handlers...")
        
        socket_handlers = page.evaluate('() => {
            return typeof window.socketClient !== "undefined" && 
                   typeof window.socketClient.request === "function";
        }')
        print(f"   socketClient.request exists: {'✅' if socket_handlers else '❌'}")
        
        # Test direct socket request
        test_request = page.evaluate('async () => {
            try {
                const response = await window.socketClient.request("config:get", {});
                return {success: response.success, hasData: !!response.data};
            } catch (e) {
                return {error: e.message};
            }
        }')
        print(f"   Direct config:get request: {test_request}")
        
        # Print relevant console logs
        print("\n[CONSOLE LOGS - Last 30 lines]")
        for msg in console_output[-30:]:
            if any(x in msg for x in ['socketClient', 'request', 'loaded', 'error', 'Error', 'DATA']):
                print(f"   {msg}")
        
        context.close()
        browser.close()
    
    # Final Results
    print("\n" + "="*70)
    print("FINAL RESULTS")
    print("="*70)
    
    if all_errors:
        print(f"\n❌ Console Errors ({len(all_errors)}):")
        for e in all_errors[:10]:
            print(f"   - {e}")
        return 1
    else:
        print("\n✅ No console errors detected!")
        print("\nNote: Data loading depends on server-side handlers.")
        print("Check if server handlers are returning proper data format.")
        return 0

if __name__ == "__main__":
    sys.exit(test_all_data_loading())
