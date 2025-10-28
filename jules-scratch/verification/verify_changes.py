from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Navigate to the login page
    page.goto("http://localhost:3000/login")
    page.get_by_role("button", name="Login").wait_for()

    # Fill in the login form and submit
    page.get_by_label("Email").fill("admin@whatsdex.com")
    page.get_by_label("Password").fill("password")
    page.get_by_role("button", name="Login").click()

    # Wait for navigation to the admin page
    page.wait_for_url("http://localhost:3000/admin")

    # Navigate to the users page and take a screenshot
    page.goto("http://localhost:3000/admin/users")
    page.screenshot(path="jules-scratch/verification/users_page.png")

    # Navigate to the analytics page and take a screenshot
    page.goto("http://localhost:3000/admin/analytics")
    page.screenshot(path="jules-scratch/verification/analytics_page.png")

    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
