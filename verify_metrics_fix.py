#!/usr/bin/env python3
"""
Verify the double-transformation bug fix for metrics display.
Tests that dashboard metrics show actual values (not 0) and checks for console errors.
"""

from playwright.sync_api import sync_playwright
import json
import sys


def check_metrics_display(page):
    """Check if metrics display actual values instead of 0"""
    metrics_data = {}

    # Try to find metric values in the dashboard
    # Look for metric cards or displays
    metric_selectors = [
        '[data-testid*="metric"]',
        ".metric-card",
        ".metric-value",
        '[class*="metric"]',
        '[class*="Metric"]',
    ]

    # Wait a bit for metrics to load
    page.wait_for_timeout(2000)

    # Get page content and look for metric displays
    content = page.content()

    # Look for common metric patterns
    patterns = {
        "CPU": r"CPU[:\s]+(\d+(?:\.\d+)?)",
        "Memory": r"Memory[:\s]+(\d+(?:\.\d+)?)",
        "Disk": r"Disk[:\s]+(\d+(?:\.\d+)?)",
        "GPU": r"GPU[:\s]+(\d+(?:\.\d+)?)",
    }

    import re

    for metric_name, pattern in patterns.items():
        matches = re.findall(pattern, content, re.IGNORECASE)
        if matches:
            values = [float(m) for m in matches if float(m) > 0]
            if values:
                metrics_data[metric_name] = values
                print(f"✓ {metric_name}: Found non-zero values: {values}")
            else:
                print(f"✗ {metric_name}: Only found zero values")
                metrics_data[metric_name] = [0.0]
        else:
            print(f"⚠ {metric_name}: Pattern not found in page content")

    return metrics_data


def main():
    """Main test function"""
    results = {
        "dashboard_metrics": {},
        "console_errors": [],
        "pages_loaded": [],
        "success": False,
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()

        # Enable console logging
        console_messages = []

        def handle_console(msg):
            if msg.type in ["error", "warning"]:
                console_messages.append(
                    {"type": msg.type, "text": msg.text, "location": msg.location}
                )
                print(f"Console {msg.type}: {msg.text}")

        page = context.new_page()
        page.on("console", handle_console)

        try:
            # Test 1: Dashboard
            print("\n=== Testing Dashboard ===")
            page.goto("http://localhost:3000/dashboard", timeout=30000)
            page.wait_for_load_state("networkidle", timeout=10000)
            page.wait_for_timeout(3000)  # Extra wait for metrics to load

            # Take screenshot
            screenshot_path = "/home/bamer/nextjs-llama-async-proxy/metrics-verification-screenshot.png"
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"✓ Dashboard screenshot saved to {screenshot_path}")

            # Check metrics
            metrics_data = check_metrics_display(page)
            results["dashboard_metrics"] = metrics_data

            # Check if we have actual metric values (not all zeros)
            all_zeros = all(
                all(v == 0.0 for v in values) for values in metrics_data.values()
            )

            if metrics_data and not all_zeros:
                print("✓ Dashboard shows actual metric values (not all zeros)")
                results["dashboard_success"] = True
            else:
                print("✗ Dashboard metrics are all zeros or missing")
                results["dashboard_success"] = False

            results["pages_loaded"].append("dashboard")

            # Test 2: Models page
            print("\n=== Testing Models Page ===")
            page.goto("http://localhost:3000/models", timeout=30000)
            page.wait_for_load_state("networkidle", timeout=10000)
            page.wait_for_timeout(2000)

            models_screenshot = "/home/bamer/nextjs-llama-async-proxy/models-verification-screenshot.png"
            page.screenshot(path=models_screenshot, full_page=True)
            print(f"✓ Models page screenshot saved to {models_screenshot}")

            # Check if models are loaded
            content = page.content()
            if "model" in content.lower():
                print("✓ Models page loaded successfully")
                results["pages_loaded"].append("models")
            else:
                print("⚠ Models page may not have loaded models")

            # Test 3: Monitoring page
            print("\n=== Testing Monitoring Page ===")
            page.goto("http://localhost:3000/monitoring", timeout=30000)
            page.wait_for_load_state("networkidle", timeout=10000)
            page.wait_for_timeout(2000)

            monitoring_screenshot = "/home/bamer/nextjs-llama-async-proxy/monitoring-verification-screenshot.png"
            page.screenshot(path=monitoring_screenshot, full_page=True)
            print(f"✓ Monitoring page screenshot saved to {monitoring_screenshot}")

            # Check if charts are present
            content = page.content()
            if "chart" in content.lower() or "metric" in content.lower():
                print("✓ Monitoring page loaded with charts/metrics")
                results["pages_loaded"].append("monitoring")
            else:
                print("⚠ Monitoring page may not have loaded charts")

        except Exception as e:
            print(f"✗ Error during testing: {str(e)}")
            results["error"] = str(e)

        finally:
            # Collect console errors
            if console_messages:
                print(
                    f"\n=== Console Messages ({len(console_messages)} errors/warnings) ==="
                )
                for msg in console_messages:
                    print(f"  {msg['type']}: {msg['text']}")
                results["console_errors"] = console_messages
            else:
                print("\n✓ No console errors or warnings found")

            browser.close()

    # Determine overall success
    results["success"] = (
        results.get("dashboard_success", False)
        and len([e for e in console_messages if e["type"] == "error"]) == 0
        and len(results["pages_loaded"]) >= 2
    )

    # Print summary
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    print(
        f"Dashboard metrics: {'PASS' if results.get('dashboard_success') else 'FAIL'}"
    )
    print(
        f"Console errors: {len([e for e in console_messages if e['type'] == 'error'])} found"
    )
    print(
        f"Pages loaded: {len(results['pages_loaded'])} ({', '.join(results['pages_loaded'])})"
    )
    print(f"Overall: {'✓ PASS' if results['success'] else '✗ FAIL'}")
    print("=" * 60)

    # Save results to JSON
    results_path = (
        "/home/bamer/nextjs-llama-async-proxy/metrics-verification-results.json"
    )
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\nResults saved to {results_path}")

    return 0 if results["success"] else 1


if __name__ == "__main__":
    sys.exit(main())
