#!/usr/bin/env python3
"""
Playwright Test: Dashboard Async Loading Verification
Tests if the dashboard loads progressively or if it still waits for all data.
"""

from playwright.sync_api import sync_playwright
import time
import json

def test_dashboard_loading():
    """Test dashboard loading sequence and timing"""
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Show browser for visual inspection
        page = browser.new_page()
        
        # Track performance
        start_time = time.time()
        
        print("\n" + "=" * 80)
        print("DASHBOARD ASYNC LOADING TEST")
        print("=" * 80)
        
        # 1. Navigate to dashboard
        print("\n[TEST] Navigating to dashboard...")
        page.goto('http://localhost:3000/')
        
        # 2. Check for skeleton UI immediately (should appear in < 200ms)
        print("[TEST] Checking for skeleton UI within first 200ms...")
        time.sleep(0.1)  # Wait 100ms for initial render
        
        skeleton_check_time = time.time() - start_time
        skeleton_elements = page.locator('[class*="loading-skeleton"]').count()
        
        print(f"  ⏱️  Time to skeleton check: {skeleton_check_time*1000:.0f}ms")
        print(f"  📦 Skeleton elements found: {skeleton_elements}")
        
        if skeleton_elements > 0:
            print(f"  ✅ GOOD: Skeleton UI appeared ({skeleton_elements} elements)")
        else:
            print(f"  ❌ PROBLEM: No skeleton UI found! Dashboard might be waiting...")
            page.screenshot(path='/tmp/no-skeleton.png', full_page=True)
            print(f"     Screenshot saved: /tmp/no-skeleton.png")
        
        # 3. Wait for first data to appear
        print("\n[TEST] Waiting for first data to load...")
        first_data_time = None
        
        for i in range(60):  # Wait up to 6 seconds
            time.sleep(0.1)
            elapsed = time.time() - start_time
            
            # Check if metrics section loaded (should have actual data, not skeleton)
            metrics_section = page.locator('[data-section="metrics"]')
            has_metrics = False
            if metrics_section.count() > 0:
                class_attr = metrics_section.get_attribute('class')
                has_metrics = class_attr and 'loading-skeleton' not in class_attr
            
            if has_metrics and first_data_time is None:
                first_data_time = elapsed
                print(f"  ✅ First data visible at {elapsed*1000:.0f}ms")
            
            if i % 10 == 0:
                print(f"  ⏳ {elapsed*1000:.0f}ms...")
        
        # 4. Wait for full dashboard to load
        print("\n[TEST] Waiting for full dashboard load...")
        full_load_time = None
        
        for i in range(120):  # Wait up to 12 seconds
            time.sleep(0.1)
            elapsed = time.time() - start_time
            
            # Check all sections loaded
            sections = ['metrics', 'charts', 'gpu', 'router']
            all_loaded = True
            
            for section in sections:
                elem = page.locator(f'[data-section="{section}"]')
                if elem.count() > 0:
                    class_attr = elem.get_attribute('class') or ''
                    has_loading = 'loading-skeleton' in class_attr
                    if has_loading:
                        all_loaded = False
                        break
            
            if all_loaded and full_load_time is None:
                full_load_time = elapsed
                print(f"  ✅ Full dashboard loaded at {elapsed*1000:.0f}ms")
            
            if elapsed > 2 and i % 20 == 0:
                print(f"  ⏳ {elapsed*1000:.0f}ms...")
            
            if elapsed > 10:
                break
        
        # 5. Check Network activity
        print("\n[TEST] Checking network requests...")
        
        # Get all network requests from the page
        requests_fired = []
        request_times = {}
        response_times = {}
        
        def on_request(request):
            url = request.url
            if 'socket.io' in url or url.endswith('.html') or url.endswith('.js') or url.endswith('.css'):
                requests_fired.append(url)
                request_times[url] = time.time()
        
        def on_response(response):
            url = response.url
            if url in request_times:
                response_times[url] = time.time()
        
        page.on("request", on_request)
        page.on("response", on_response)
        
        # Wait a bit more to capture all requests
        time.sleep(1)
        
        print(f"  📊 Total requests captured: {len(requests_fired)}")
        
        # 6. Check for parallel vs sequential loading
        print("\n[TEST] Checking request pattern...")
        
        socket_requests = [r for r in requests_fired if 'socket.io' in r]
        print(f"  🔌 Socket.IO connections: {len(socket_requests)}")
        
        # 7. Final Status
        print("\n" + "=" * 80)
        print("RESULTS SUMMARY")
        print("=" * 80)
        
        total_time = time.time() - start_time
        
        print(f"\n⏱️  TIMING:")
        print(f"  Skeleton UI:     {skeleton_check_time*1000:.0f}ms")
        print(f"  First data:      {first_data_time*1000:.0f}ms" if first_data_time else "  First data:      NOT DETECTED")
        print(f"  Full dashboard:  {full_load_time*1000:.0f}ms" if full_load_time else "  Full dashboard:  NOT LOADED")
        print(f"  Total elapsed:   {total_time*1000:.0f}ms")
        
        # Performance Assessment
        print(f"\n📊 ASSESSMENT:")
        
        if skeleton_elements > 0:
            print(f"  ✅ Skeleton UI working")
        else:
            print(f"  ❌ Skeleton UI NOT working - no loading indicators")
        
        if first_data_time and first_data_time < 1:
            print(f"  ✅ First data fast ({first_data_time*1000:.0f}ms)")
        elif first_data_time:
            print(f"  ⚠️  First data slow ({first_data_time*1000:.0f}ms)")
        else:
            print(f"  ❌ First data NOT loading")
        
        if full_load_time and full_load_time < 2:
            print(f"  ✅ Full load fast ({full_load_time*1000:.0f}ms)")
        elif full_load_time and full_load_time < 5:
            print(f"  ⚠️  Full load moderate ({full_load_time*1000:.0f}ms)")
        else:
            print(f"  ❌ Full load slow (> 5s)")
        
        # 8. Take screenshots for visual inspection
        print("\n📸 SCREENSHOTS:")
        page.screenshot(path='/tmp/dashboard-final.png', full_page=True)
        print(f"  Screenshot saved: /tmp/dashboard-final.png")
        
        # 9. Check console for errors
        print("\n🔍 CONSOLE CHECK:")
        console_messages = []
        
        def on_console(msg):
            console_messages.append({
                'type': msg.type,
                'text': msg.text
            })
        
        page.on("console", on_console)
        
        # Check if there are any async/loading related messages
        time.sleep(1)
        
        async_messages = [m for m in console_messages if 'async' in m['text'].lower() or 'loading' in m['text'].lower()]
        error_messages = [m for m in console_messages if m['type'] == 'error']
        
        print(f"  📝 Total console messages: {len(console_messages)}")
        print(f"  🔄 Async/Loading messages: {len(async_messages)}")
        print(f"  ❌ Errors: {len(error_messages)}")
        
        if error_messages:
            print(f"\n  Error details:")
            for msg in error_messages[:5]:
                print(f"    - {msg['text']}")
        
        # 10. Detailed recommendations
        print("\n" + "=" * 80)
        print("RECOMMENDATIONS")
        print("=" * 80)
        
        if skeleton_elements == 0:
            print("\n❌ CRITICAL: Skeleton UI not rendering")
            print("  Action: Check if _renderSkeletonUI() is being called in onMount()")
            print("  Check: Verify loading-skeleton class is in CSS")
            print("  Debug: Open DevTools and check page.js for errors")
        
        if first_data_time and first_data_time > 5:
            print(f"\n❌ SLOW: First data takes {first_data_time:.1f}s")
            print("  Action: Check if requests are being blocked/queued")
            print("  Check: DevTools Network tab for request waterfall")
            print("  Debug: Verify all requests fire at same time, not sequentially")
        
        if full_load_time and full_load_time > 3:
            print(f"\n⚠️  SLOW: Full load takes {full_load_time:.1f}s")
            print("  Action: Check if state subscriptions are working")
            print("  Check: DevTools Console for subscription logs")
            print("  Debug: Run test-async-dashboard.js for timing analysis")
        
        print("\n" + "=" * 80)
        
        browser.close()
        
        return {
            'skeleton_elements': skeleton_elements,
            'first_data_ms': first_data_time * 1000 if first_data_time else None,
            'full_load_ms': full_load_time * 1000 if full_load_time else None,
            'total_time_ms': total_time * 1000,
            'test_passed': skeleton_elements > 0 and first_data_time and first_data_time < 2 and full_load_time and full_load_time < 3
        }

if __name__ == '__main__':
    result = test_dashboard_loading()
    print(f"\nTest result: {'PASSED ✅' if result['test_passed'] else 'FAILED ❌'}")
    print(json.dumps(result, indent=2))
