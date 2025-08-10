from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Navigate to the app
            page.goto("http://localhost:5173/", timeout=30000)

            # Wait for the header to be visible to ensure the page is loaded
            header = page.locator("header")
            expect(header).to_be_visible()

            # Locate the select element and check for the GFS Model option
            model_selector = page.locator("#model-select")
            expect(model_selector).to_be_visible()

            # Check that the option exists
            gfs_option = model_selector.locator('option[value="gfs"]')
            expect(gfs_option).to_have_text("GFS Model")

            # Take a screenshot
            page.screenshot(path="jules-scratch/verification/verification.png")
            print("Screenshot taken successfully.")

        except Exception as e:
            print(f"An error occurred: {e}")
            # Take a screenshot even if there's an error to help with debugging
            page.screenshot(path="jules-scratch/verification/error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()
