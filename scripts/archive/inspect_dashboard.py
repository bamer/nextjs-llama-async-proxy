#!/usr/bin/env python3
"""
Detailed inspection of dashboard metrics to understand the DOM structure.
"""

from playwright.sync_api import sync_playwright
import json
import re


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        try:
            print("=== Inspecting Dashboard ===")
            page.goto("http://localhost:3000/dashboard", timeout=30000)
            page.wait_for_load_state("networkidle", timeout=10000)
            page.wait_for_timeout(3000)

            # Get page content and save for analysis
            content = page.content()
            with open(
                "/home/bamer/nextjs-llama-async-proxy/dashboard-content.html", "w"
            ) as f:
                f.write(content)
            print("✓ Saved page content to dashboard-content.html")

            # Look for metric cards using different selectors
            print("\n=== Looking for metric elements ===")

            # Try to find elements with metric-related classes
            selectors_to_try = [
                '[class*="metric"]',
                '[data-testid*="metric"]',
                '[class*="Metric"]',
                ".MuiCard-root",
                ".card",
                '[class*="card"]',
                "text=CPU",
                "text=Memory",
                "text=Disk",
                "text=GPU",
            ]

            for selector in selectors_to_try:
                try:
                    elements = page.locator(selector).all()
                    if elements:
                        print(
                            f"\nSelector '{selector}': Found {len(elements)} element(s)"
                        )
                        for i, elem in enumerate(elements[:3]):
                            text_content = elem.text_content()
                            if text_content:
                                print(f"  [{i}] {text_content[:100]}")
                except Exception as e:
                    pass

            # Try to find all cards
            print("\n=== Looking for cards ===")
            try:
                cards = page.locator('.MuiCard-root, .card, [class*="card"]').all()
                print(f"Found {len(cards)} card elements")

                for i, card in enumerate(cards):
                    text = card.text_content()
                    if text is None:
                        continue
                    print(f"\nCard {i}:")
                    print(f"  Text: {text[:200]}")

                    # Check for metric values
                    text_lower = text.lower()
                    keywords = ["cpu", "memory", "disk", "gpu", "%", "gb"]
                    if any(keyword in text_lower for keyword in keywords):
                        print(f"  ⚠ Likely a metric card!")
                        # Try to extract numeric values
                        numbers = re.findall(r"\d+\.?\d*", text)
                        print(f"  Numbers found: {numbers}")
            except Exception as e:
                print(f"Error checking cards: {e}")

            # Take a focused screenshot
            page.screenshot(
                path="/home/bamer/nextjs-llama-async-proxy/dashboard-detailed-screenshot.png",
                full_page=True,
            )
            print("\n✓ Detailed screenshot saved")

            # Check for React component state in dev tools
            print("\n=== Checking for metric data ===")

            # Try to get window object state
            result = page.evaluate("""() => {
                return {
                    metrics: typeof window !== 'undefined' ? window.metrics : null,
                    hasAnyStore: typeof window !== 'undefined' && window.__NEXT_DATA__ ? true : false
                }
            }""")
            print(f"Window state: {json.dumps(result, indent=2)}")

        finally:
            browser.close()


if __name__ == "__main__":
    main()
