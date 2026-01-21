#!/usr/bin/env python3
"""Full trace of config save"""
from playwright.sync_api import sync_playwright
import sys

def test_full_trace():
    all_errors = []
    logs = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1400, 'height': 900})
        page = context.new_page()
        
        def handle_console(msg):
            logs.append(f"[{msg.type}] {msg.text}")
            if msg.type == 'error' and 'favicon' not in msg.text.lower():
                all_errors.append(f"{msg.type}: {msg.text}")
        
        page.on("console", handle_console)
        
        print("="*70)
        print("FULL CONFIG TRACE")
        print("="*70)
        
        # Load page
        page.goto('http://localhost:3000/settings')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)
        
        # Fill field and dispatch events
        print("\n[1] Setting host to '127.0.0.1'...")
        page.evaluate("""() => {
            const input = document.querySelector('[data-field="host"]');
            input.value = "127.0.0.1";
            input.dispatchEvent(new Event('input', {bubbles: true}));
            input.dispatchEvent(new Event('change', {bubbles: true}));
        }""")
        
        # Get what will be sent
        print("\n[2] Data that will be sent to server:")
        data_to_send = page.evaluate("""() => {
            const comp = document.querySelector(".settings-page")?._component;
            if (!comp) return {error: "No component"};
            
            const routerConfig = {
                ...comp.routerConfig,
                ...comp._localRouterChanges,
                host: comp._localRouterChanges.host || comp.routerConfig?.host,
                port: parseInt(comp._localRouterChanges.port) || parseInt(comp.routerConfig?.port) || 8080,
            };
            
            return {
                routerConfig: routerConfig,
                loggingConfig: {
                    logLevel: comp._localLoggingChanges.logLevel || comp.logLevel,
                    maxFileSize: comp.maxFileSize,
                    maxFiles: comp.maxFiles,
                    enableFileLogging: comp.enableFileLogging,
                    enableDatabaseLogging: comp.enableDatabaseLogging,
                    enableConsoleLogging: comp.enableConsoleLogging,
                }
            };
        }""")
        print(f"   routerConfig.host: {data_to_send.get('routerConfig', {}).get('host')}")
        print(f"   routerConfig.port: {data_to_send.get('routerConfig', {}).get('port')}")
        
        # Call save and capture the exact request
        print("\n[3] Calling socket request directly...")
        direct_result = page.evaluate("""async () => {
            // Build the exact data that would be sent
            const comp = document.querySelector(".settings-page")?._component;
            if (!comp) return {error: "No component"};
            
            const routerConfig = {
                ...comp.routerConfig,
                ...comp._localRouterChanges,
                host: comp._localRouterChanges.host || comp.routerConfig?.host,
                port: parseInt(comp._localRouterChanges.port) || parseInt(comp.routerConfig?.port) || 8080,
            };
            
            const loggingConfig = {
                logLevel: comp._localLoggingChanges.logLevel || comp.logLevel,
                maxFileSize: comp.maxFileSize,
                maxFiles: comp.maxFiles,
                enableFileLogging: comp.enableFileLogging,
                enableDatabaseLogging: comp.enableDatabaseLogging,
                enableConsoleLogging: comp.enableConsoleLogging,
            };
            
            console.log("[TEST] Sending config:update with:", JSON.stringify({routerConfig, loggingConfig}, null, 2));
            
            const response = await window.socketClient.request("config:update", {
                routerConfig,
                loggingConfig
            });
            
            return {
                success: response.success,
                error: response.error,
                returnedConfig: response.data
            };
        }""")
        print(f"   Response: {direct_result}")
        
        page.wait_for_timeout(2000)
        
        # Check config after direct request
        print("\n[4] Config after direct request:")
        config_after = page.evaluate("""async () => {
            const r = await window.socketClient.request("config:get", {});
            return {success: r.success, host: r.data?.config?.host};
        }""")
        print(f"   {config_after}")
        
        # Print relevant logs
        print("\n[Relevant console logs]")
        for log in logs:
            if any(x in log.lower() for x in ['config', 'save', 'router', 'debug', 'error']):
                print(f"   {log}")
        
        context.close()
        browser.close()
    
    print("\n" + "="*70)
    return 0

if __name__ == "__main__": sys.exit(test_full_trace())
