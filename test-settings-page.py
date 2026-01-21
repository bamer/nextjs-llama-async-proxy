#!/usr/bin/env python3
"""Settings page specific test"""
from playwright.sync_api import sync_playwright
import sys

def test_settings_page():
    all_errors = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1400, 'height': 900})
        page = context.new_page()
        
        def handle_console(msg):
            text = msg.text
            if msg.type == 'error' and 'favicon' not in text.lower():
                all_errors.append(f"Console Error: {text}")
        
        page.on("console", handle_console)
        
        print("="*70)
        print("TESTING SETTINGS PAGE")
        print("="*70)
        
        # Load Settings Page
        print("\n[TEST 1] Loading Settings page...")
        page.goto('http://localhost:3000/settings')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(3000)
        
        # Check config loaded
        config_loaded = page.evaluate("""() => {
            const comp = document.querySelector(".settings-page")?._component;
            if (!comp) return {error: "No component found"};
            return {
                hasRouterConfig: !!comp.routerConfig,
                host: comp.routerConfig?.host,
                port: comp.routerConfig?.port,
            };
        }""")
        print(f"   Config loaded: {config_loaded}")
        
        # Check input values
        host_value = page.evaluate('() => document.querySelector("[data-field=host]")?.value || "not found"')
        print(f"   Host input value: {host_value}")
        
        # Modify field
        print("\n[TEST 2] Modifying host field...")
        page.fill("[data-field=host]", "127.0.0.1")
        
        # Test Save
        print("\n[TEST 3] Testing save...")
        page.click("[data-action=save]")
        page.wait_for_timeout(2000)
        
        # Reload and verify
        print("\n[TEST 4] Verifying data persisted...")
        page.reload()
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(3000)
        
        new_host_value = page.evaluate('() => document.querySelector("[data-field=host]")?.value || "not found"')
        print(f"   Host after reload: {new_host_value}")
        
        # Direct socket test
        print("\n[TEST 5] Direct socket config test...")
        direct_config = page.evaluate("""async () => {
            try {
                const response = await window.socketClient.request("config:get", {});
                return {success: response.success, host: response.data?.config?.host};
            } catch (e) { return {error: e.message}; }
        }""")
        print(f"   Direct config:get: {direct_config}")
        
        context.close()
        browser.close()
    
    print("\n" + "="*70)
    if all_errors:
        print(f"Console Errors: {len(all_errors)}")
        for e in all_errors[:5]: print(f"   - {e}")
        return 1
    else:
        print("No console errors!")
        return 0

if __name__ == "__main__": sys.exit(test_settings_page())
