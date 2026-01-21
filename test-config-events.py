#!/usr/bin/env python3
"""Debug config save with proper events"""
from playwright.sync_api import sync_playwright
import sys

def test_config_events():
    all_errors = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1400, 'height': 900})
        page = context.new_page()
        
        def handle_console(msg):
            if msg.type == 'error' and 'favicon' not in msg.text.lower():
                all_errors.append(f"{msg.type}: {msg.text}")
            if 'config:update' in msg.text or 'save' in msg.text.lower():
                print(f"   [{msg.type}] {msg.text}")
        
        page.on("console", handle_console)
        
        print("="*70)
        print("DEBUGGING CONFIG SAVE WITH PROPER EVENTS")
        print("="*70)
        
        # Load Settings Page
        page.goto('http://localhost:3000/settings')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)
        
        # Fill and dispatch events properly
        print("\n[1] Filling field with proper events...")
        page.evaluate("""() => {
            const input = document.querySelector('[data-field="host"]');
            input.value = "127.0.0.1";
            input.dispatchEvent(new Event('input', {bubbles: true}));
            input.dispatchEvent(new Event('change', {bubbles: true}));
        }""")
        
        # Verify change was tracked
        tracked = page.evaluate("""() => {
            const comp = document.querySelector(".settings-page")?._component;
            return {localChanges: comp._localRouterChanges, routerHost: comp.routerConfig?.host};
        }""")
        print(f"   After event dispatch: {tracked}")
        
        # Click save button using evaluate to call the function directly
        print("\n[2] Calling _save() directly...")
        save_result = page.evaluate("""async () => {
            const comp = document.querySelector(".settings-page")?._component;
            if (comp) {
                await comp._save();
                return {saved: true};
            }
            return {saved: false, error: "No component"};
        }""")
        print(f"   Save result: {save_result}")
        
        # Wait and check
        page.wait_for_timeout(2000)
        
        # Get config after save
        print("\n[3] Config after save:")
        config = page.evaluate("""async () => {
            const r = await window.socketClient.request("config:get", {});
            return {success: r.success, host: r.data?.config?.host};
        }""")
        print(f"   {config}")
        
        # Reload and check
        page.reload()
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)
        
        print("\n[4] Config after reload:")
        config2 = page.evaluate("""async () => {
            const r = await window.socketClient.request("config:get", {});
            return {success: r.success, host: r.data?.config?.host};
        }""")
        print(f"   {config2}")
        
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

if __name__ == "__main__": sys.exit(test_config_events())
