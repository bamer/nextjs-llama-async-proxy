#!/usr/bin/env python3
"""
Playwright Diagnostics: Check what's happening on the dashboard
"""

from playwright.sync_api import sync_playwright
import time

def test_dashboard_diagnostics():
    """Detailed diagnostics of dashboard loading"""
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        
        print("\n" + "=" * 80)
        print("DASHBOARD DIAGNOSTICS")
        print("=" * 80)
        
        # Capture console messages
        console_logs = []
        def on_console(msg):
            console_logs.append(f"[{msg.type.upper()}] {msg.text}")
            print(f"  {msg.type.upper()}: {msg.text}")
        
        page.on("console", on_console)
        
        # Capture network requests
        network_requests = []
        def on_request(request):
            network_requests.append({
                'url': request.url,
                'method': request.method,
                'time': time.time()
            })
            if 'socket.io' in request.url:
                print(f"  🔌 NETWORK: {request.method} {request.url}")
        
        page.on("request", on_request)
        
        print("\n[LOAD] Navigating to dashboard...")
        start = time.time()
        page.goto('http://localhost:3000/')
        elapsed = time.time() - start
        print(f"  Page loaded in {elapsed:.2f}s")
        
        # Wait a bit for JS to execute
        time.sleep(0.5)
        
        # Check DOM structure
        print("\n[DOM] Checking dashboard structure...")
        
        # Check if skeleton elements exist
        skeleton_count = page.locator('[class*="loading-skeleton"]').count()
        print(f"  Skeleton elements: {skeleton_count}")
        
        # Check data-section elements
        sections = page.locator('[data-section]').count()
        print(f"  Data-section elements: {sections}")
        
        # Get HTML of first section
        first_section = page.locator('[data-section]').first
        if first_section.count() > 0:
            html = first_section.inner_html()[:200]
            print(f"  First section HTML (first 200 chars):")
            print(f"    {html}...")
        
        # Check console for dashboard logs
        print("\n[CONSOLE] Looking for dashboard logs...")
        time.sleep(1)
        
        # Filter logs
        dashboard_logs = [l for l in console_logs if 'DASHBOARD' in l or 'DEBUG' in l]
        controller_logs = [l for l in console_logs if 'Controller' in l]
        
        print(f"  Dashboard logs: {len(dashboard_logs)}")
        for log in dashboard_logs[:10]:
            print(f"    {log}")
        
        print(f"\n  Controller logs: {len(controller_logs)}")
        for log in controller_logs[:10]:
            print(f"    {log}")
        
        # Check metrics in state
        print("\n[STATE] Checking state values...")
        metrics = page.evaluate("() => typeof window.stateManager !== 'undefined' ? window.stateManager.get('metrics') : null")
        models = page.evaluate("() => typeof window.stateManager !== 'undefined' ? window.stateManager.get('models') : null")
        presets = page.evaluate("() => typeof window.stateManager !== 'undefined' ? window.stateManager.get('presets') : null")
        
        print(f"  Metrics in state: {metrics is not None}")
        print(f"  Models in state: {models is not None}")
        print(f"  Presets in state: {presets is not None}")
        
        if models:
            print(f"    Models count: {len(models) if isinstance(models, list) else 'not a list'}")
        
        # Check if controller exists
        print("\n[CONTROLLER] Checking controller...")
        has_controller = page.evaluate("() => typeof window.router !== 'undefined'")
        print(f"  Router exists: {has_controller}")
        
        # Check routes
        routes = page.evaluate("() => typeof window.router !== 'undefined' ? Object.keys(window.router._handlers || {}) : []")
        print(f"  Routes registered: {routes}")
        
        # Try to manually trigger data load
        print("\n[TEST] Attempting to manually load data...")
        result = page.evaluate("""
          async () => {
            if (typeof window.stateManager === 'undefined') return 'NO_STATE_MANAGER';
            try {
              const metrics = await window.stateManager.getMetrics();
              return { success: true, metricsLoaded: metrics !== null };
            } catch (e) {
              return { success: false, error: e.message };
            }
          }
        """)
        print(f"  Manual load result: {result}")
        
        # Wait a bit more and check again
        print("\n[WAIT] Waiting 3 more seconds...")
        time.sleep(3)
        
        # Re-check console
        print(f"\n[CONSOLE] Total console messages: {len(console_logs)}")
        for log in console_logs[-10:]:
            print(f"  {log}")
        
        # Take screenshot
        print("\n[SCREENSHOT] Taking screenshot...")
        page.screenshot(path='/tmp/diagnostics.png', full_page=True)
        print(f"  Saved to /tmp/diagnostics.png")
        
        # Check network
        print(f"\n[NETWORK] Total requests: {len(network_requests)}")
        for req in network_requests[-10:]:
            print(f"  {req['method']} {req['url'][-80:]}")
        
        browser.close()

if __name__ == '__main__':
    test_dashboard_diagnostics()
