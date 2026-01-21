#!/usr/bin/env python3
"""Debug config save/load"""
from playwright.sync_api import sync_playwright
import sys

def test_config_debug():
    all_errors = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1400, 'height': 900})
        page = context.new_page()
        
        def handle_console(msg):
            if msg.type == 'error' and 'favicon' not in msg.text.lower():
                all_errors.append(f"{msg.type}: {msg.text}")
        
        page.on("console", handle_console)
        
        print("="*70)
        print("DEBUGGING CONFIG SAVE/LOAD")
        print("="*70)
        
        # Load Settings Page
        page.goto('http://localhost:3000/settings')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)
        
        # Get initial config from server
        print("\n[1] Initial config from server:")
        initial = page.evaluate("""async () => {
            const r = await window.socketClient.request("config:get", {});
            return {success: r.success, host: r.data?.config?.host, port: r.data?.config?.port};
        }""")
        print(f"   {initial}")
        
        # Modify field
        print("\n[2] Setting host to '127.0.0.1'")
        page.fill("[data-field=host]", "127.0.0.1")
        
        # Check local change
        local = page.evaluate("""() => {
            const comp = document.querySelector(".settings-page")?._component;
            return {localHost: comp._localRouterChanges?.host, routerHost: comp.routerConfig?.host};
        }""")
        print(f"   Local changes: {local}")
        
        # Click save
        print("\n[3] Clicking save button...")
        page.click("[data-action=save]")
        page.wait_for_timeout(3000)
        
        # Check notification
        notification = page.evaluate('() => document.querySelector(".notification")?.innerText || "none"')
        print(f"   Notification: {notification}")
        
        # Get config immediately after save
        print("\n[4] Config immediately after save:")
        after_save = page.evaluate("""async () => {
            const r = await window.socketClient.request("config:get", {});
            return {success: r.success, host: r.data?.config?.host, port: r.data?.config?.port};
        }""")
        print(f"   {after_save}")
        
        # Reload page
        page.reload()
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)
        
        # Get config after reload
        print("\n[5] Config after page reload:")
        after_reload = page.evaluate("""async () => {
            const r = await window.socketClient.request("config:get", {});
            return {success: r.success, host: r.data?.config?.host, port: r.data?.config?.port};
        }""")
        print(f"   {after_reload}")
        
        # Get component state
        component_state = page.evaluate("""() => {
            const comp = document.querySelector(".settings-page")?._component;
            return {host: comp.routerConfig?.host, port: comp.routerConfig?.port};
        }""")
        print(f"   Component state: {component_state}")
        
        # Get input value
        input_value = page.evaluate('() => document.querySelector("[data-field=host]")?.value || "not found"')
        print(f"   Input value: {input_value}")
        
        context.close()
        browser.close()
    
    print("\n" + "="*70)
    if all_errors:
        print(f"Errors: {len(all_errors)}")
        for e in all_errors[:5]: print(f"   - {e}")
        return 1
    else:
        print("No errors!")
        return 0

if __name__ == "__main__": sys.exit(test_config_debug())
