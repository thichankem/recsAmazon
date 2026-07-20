from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))
    page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))
    page.goto("http://localhost:5173")
    page.wait_for_timeout(1000)
    page.click("#user-profile-switcher")
    page.wait_for_timeout(500)
    users = page.query_selector_all("div.absolute.right-0 button")
    if len(users) > 1:
        print("Clicking second user...")
        users[1].click()
        page.wait_for_timeout(2000)
    else:
        print("Could not find users in dropdown")
    browser.close()
