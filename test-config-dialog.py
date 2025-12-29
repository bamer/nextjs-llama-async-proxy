from playwright.sync_api import sync_playwright
import time
import sys


def test_config_dialog():
    """Test the model configuration dialog on the models page."""

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=1000)
        page = browser.new_page()

        try:
            print("1. Navigating to models page...")
            page.goto("http://localhost:3000/models")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            print("2. Taking screenshot of models page...")
            page.screenshot(path="test-01-models-page.png", full_page=True)

            print("3. Looking for model cards...")
            model_cards = page.locator('[data-testid="model-card"]')
            card_count = model_cards.count()
            print(f"   Found {card_count} model cards")

            if card_count == 0:
                print("   ERROR: No model cards found!")
                page.screenshot(path="test-02-no-models.png", full_page=True)
                return

            print("4. Looking for configuration buttons...")
            config_buttons = page.locator('[data-testid^="config-btn-"]')
            button_count = config_buttons.count()
            print(f"   Found {button_count} config buttons")

            if button_count == 0:
                print("   ERROR: No config buttons found!")
                page.screenshot(path="test-03-no-config-buttons.png", full_page=True)

                # Let's check what's actually on the page
                print("5. Checking page content...")
                all_buttons = page.locator("button").all()
                print(f"   Total buttons on page: {len(all_buttons)}")
                for i, btn in enumerate(all_buttons[:10]):  # Show first 10
                    text = btn.inner_text()
                    print(f"   Button {i}: {text[:50] if text else 'empty'}")

                return

            # Get the first config button
            first_button = config_buttons.first
            button_text = first_button.inner_text()
            print(f"5. Clicking first config button: '{button_text}'...")

            # Take screenshot before click
            page.screenshot(path="test-04-before-click.png", full_page=True)

            # Click the button
            first_button.click()

            # Wait for dialog
            print("6. Waiting for dialog to open...")
            time.sleep(2)

            # Take screenshot after click
            page.screenshot(path="test-05-after-click.png", full_page=True)

            # Check for dialog
            dialog = page.locator('[role="dialog"]')
            if dialog.count() > 0:
                print("   ✓ Dialog opened successfully!")
                page.screenshot(path="test-06-dialog-open.png", full_page=True)

                # Check dialog content
                dialog_content = dialog.inner_text()
                print(f"   Dialog content length: {len(dialog_content)} chars")
                print(f"   Preview: {dialog_content[:200]}...")
            else:
                print("   ✗ Dialog did NOT open!")
                print("7. Checking console for errors...")

                # Check console logs
                console_messages = []
                page.on(
                    "console",
                    lambda msg: console_messages.append(
                        {"type": msg.type, "text": msg.text, "location": msg.location}
                    ),
                )

                page.screenshot(path="test-07-no-dialog.png", full_page=True)

                print(f"   Console errors/warnings:")
                for msg in console_messages:
                    if msg["type"] in ["error", "warning"]:
                        print(f"   {msg['type']}: {msg['text'][:100]}")

                print("8. Checking for ModelConfigDialog in DOM...")
                content = page.content()
                if "ModelConfigDialog" in content:
                    print("   ✓ ModelConfigDialog found in DOM")
                else:
                    print("   ✗ ModelConfigDialog NOT found in DOM")

                # Check if it's imported
                if "import" in content and "ModelConfigDialog" in content:
                    print("   ✓ ModelConfigDialog imported")
                else:
                    print("   ✗ ModelConfigDialog NOT imported")

        except Exception as e:
            print(f"ERROR: {e}")
            import traceback

            traceback.print_exc()

        finally:
            browser.close()


if __name__ == "__main__":
    test_config_dialog()
