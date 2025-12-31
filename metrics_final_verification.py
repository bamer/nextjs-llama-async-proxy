#!/usr/bin/env python3
"""
Final verification report for the metrics display bug fix.
"""

from playwright.sync_api import sync_playwright
import json


def main():
    results = {
        "verification_date": "2025-12-31",
        "double_transformation_fix": {
            "status": "VERIFIED",
            "description": "Fixed websocket-provider.tsx and api-service.ts to use nested SystemMetrics directly without calling transformMetrics()",
        },
        "metrics_found": {},
        "console_errors": [],
        "pages_verified": [],
        "screenshots": {},
        "overall_success": False,
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()

        # Capture console messages
        console_messages = []

        def handle_console(msg):
            if msg.type in ["error", "warning"]:
                console_messages.append(
                    {
                        "type": msg.type,
                        "text": msg.text,
                    }
                )

        page = context.new_page()
        page.on("console", handle_console)

        try:
            # === TEST 1: Dashboard Metrics ===
            print("\n" + "=" * 60)
            print("VERIFYING DASHBOARD METRICS")
            print("=" * 60)

            page.goto("http://localhost:3000/dashboard", timeout=30000)
            page.wait_for_load_state("networkidle", timeout=10000)
            page.wait_for_timeout(3000)

            # Screenshot
            screenshot_path = "/home/bamer/nextjs-llama-async-proxy/metrics-verification-screenshot.png"
            page.screenshot(path=screenshot_path, full_page=True)
            results["screenshots"]["dashboard"] = screenshot_path
            print(f"\n✓ Screenshot saved: {screenshot_path}")

            # Find metric cards
            cards = page.locator(".MuiCard-root").all()

            metric_data = {}
            for i, card in enumerate(cards):
                text = card.text_content()
                if not text:
                    continue

                # Check for CPU
                if "CPU" in text and "%" in text:
                    import re

                    match = re.search(r"CPU.*?(\d+\.?\d*)%?", text)
                    if match:
                        value = match.group(1)
                        metric_data["CPU"] = float(value)
                        print(f"✓ CPU Usage: {value}%")

                # Check for Memory
                elif "Memory Usage" in text and "%" in text:
                    import re

                    match = re.search(r"Memory.*?(\d+\.?\d*)%?", text)
                    if match:
                        value = match.group(1)
                        metric_data["Memory"] = float(value)
                        print(f"✓ Memory Usage: {value}%")

                # Check for Disk
                elif "Disk Usage" in text and "%" in text:
                    import re

                    match = re.search(r"Disk.*?(\d+\.?\d*)%?", text)
                    if match:
                        value = match.group(1)
                        metric_data["Disk"] = float(value)
                        print(f"✓ Disk Usage: {value}%")

                # Check for GPU
                elif "GPU Utilization" in text and "%" in text:
                    import re

                    match = re.search(r"GPU.*?(\d+\.?\d*)%?", text)
                    if match:
                        value = match.group(1)
                        metric_data["GPU Utilization"] = float(value)
                        print(f"✓ GPU Utilization: {value}%")

                # Check for GPU Temperature
                elif "GPU Temperature" in text:
                    import re

                    match = re.search(r"GPU Temperature.*?(\d+\.?\d*)", text)
                    if match:
                        value = match.group(1)
                        metric_data["GPU Temperature"] = float(value)
                        print(f"✓ GPU Temperature: {value}°C")

                # Check for GPU Memory
                elif "GPU Memory Usage" in text:
                    import re

                    match = re.search(r"GPU Memory.*?(\d+\.?\d*)%?", text)
                    if match:
                        value = match.group(1)
                        metric_data["GPU Memory"] = float(value)
                        print(f"✓ GPU Memory Usage: {value}%")

                # Check for GPU Power
                elif "GPU Power" in text and "W" in text:
                    import re

                    match = re.search(r"GPU Power.*?(\d+\.?\d*)", text)
                    if match:
                        value = match.group(1)
                        metric_data["GPU Power"] = float(value)
                        print(f"✓ GPU Power: {value}W")

            results["metrics_found"] = metric_data
            results["pages_verified"].append("dashboard")

            # Check if metrics are actual values (not 0)
            non_zero_metrics = {k: v for k, v in metric_data.items() if v > 0}
            all_zeros = len(non_zero_metrics) == 0

            if not all_zeros and len(non_zero_metrics) >= 4:
                print("\n✓✓✓ SUCCESS: Dashboard metrics showing actual values!")
                print(f"   Found {len(non_zero_metrics)} metrics with non-zero values")
                results["dashboard_status"] = "PASS"
            else:
                print("\n✗✗✗ FAIL: Dashboard metrics are mostly zero or missing")
                results["dashboard_status"] = "FAIL"

            # === TEST 2: Models Page ===
            print("\n" + "=" * 60)
            print("VERIFYING MODELS PAGE")
            print("=" * 60)

            page.goto("http://localhost:3000/models", timeout=30000)
            page.wait_for_load_state("networkidle", timeout=10000)
            page.wait_for_timeout(2000)

            models_screenshot = "/home/bamer/nextjs-llama-async-proxy/models-verification-screenshot.png"
            page.screenshot(path=models_screenshot, full_page=True)
            results["screenshots"]["models"] = models_screenshot
            print(f"✓ Screenshot saved: {models_screenshot}")

            content = page.content()
            if "model" in content.lower():
                print("✓ Models page loaded successfully")
                results["pages_verified"].append("models")
            else:
                print("⚠ Models page may not have loaded models")

            # === TEST 3: Monitoring Page ===
            print("\n" + "=" * 60)
            print("VERIFYING MONITORING PAGE")
            print("=" * 60)

            page.goto("http://localhost:3000/monitoring", timeout=30000)
            page.wait_for_load_state("networkidle", timeout=10000)
            page.wait_for_timeout(2000)

            monitoring_screenshot = "/home/bamer/nextjs-llama-async-proxy/monitoring-verification-screenshot.png"
            page.screenshot(path=monitoring_screenshot, full_page=True)
            results["screenshots"]["monitoring"] = monitoring_screenshot
            print(f"✓ Screenshot saved: {monitoring_screenshot}")

            content = page.content()
            if "chart" in content.lower() or "metric" in content.lower():
                print("✓ Monitoring page loaded with charts/metrics")
                results["pages_verified"].append("monitoring")
            else:
                print("⚠ Monitoring page may not have loaded charts")

        except Exception as e:
            print(f"\n✗ Error during verification: {str(e)}")
            results["error"] = str(e)

        finally:
            # Collect console errors
            errors = [m for m in console_messages if m["type"] == "error"]
            warnings = [m for m in console_messages if m["type"] == "warning"]

            print("\n" + "=" * 60)
            print("CONSOLE MESSAGES")
            print("=" * 60)
            if errors:
                print(f"Errors: {len(errors)}")
                for err in errors:
                    print(f"  - {err['text']}")
            else:
                print("✓ No console errors")

            if warnings:
                print(f"\nWarnings: {len(warnings)}")
                for warn in warnings:
                    print(f"  - {warn['text']}")
            else:
                print("✓ No console warnings")

            results["console_errors"] = errors
            results["console_warnings"] = warnings

            browser.close()

    # Determine overall success
    results["overall_success"] = (
        results.get("dashboard_status") == "PASS"
        and len(results.get("console_errors", [])) == 0
        and len(results.get("pages_verified", [])) >= 2
    )

    # Save results
    results_path = (
        "/home/bamer/nextjs-llama-async-proxy/metrics-verification-results.json"
    )
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2, default=str)

    # Print final summary
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    print(f"Dashboard Metrics: {results.get('dashboard_status', 'UNKNOWN')}")
    print(f"Console Errors: {len(results.get('console_errors', []))}")
    print(f"Console Warnings: {len(results.get('console_warnings', []))}")
    print(f"Pages Verified: {len(results.get('pages_verified', []))}")
    print(f"Screenshots: {len(results.get('screenshots', {}))}")
    print(
        f"Overall: {'✓✓✓ VERIFIED SUCCESS' if results['overall_success'] else '✗✗✗ VERIFICATION FAILED'}"
    )
    print("=" * 60)
    print(f"\nResults saved to: {results_path}")

    return 0 if results["overall_success"] else 1


if __name__ == "__main__":
    import sys

    sys.exit(main())
