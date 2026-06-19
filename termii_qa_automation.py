import asyncio
from playwright.async_api import async_playwright
import time
import os

# Configuration
BASE_URL = "https://termii.vercel.app"
USERNAME = "vincent.chidiebere@outlook.com"
PASSWORD = "Vincent1993#"
SCREENSHOT_DIR = "qa_screenshots"

os.makedirs(SCREENSHOT_DIR, exist_ok=True)

async def run_qa_tests():
    async with async_playwright() as p:
        # Launch headed browser so the user can watch the execution
        print("Launching browser...")
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 800}
        )
        page = await context.new_page()

        # Step 1: Navigate to Home/Login page
        print(f"\n[Step 1] Navigating to {BASE_URL}...")
        await page.goto(BASE_URL)
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/1_landing_page.png")
        print("Landing page screenshot saved.")

        # Check if we are on login page, or click login button
        print("Navigating to login route...")
        await page.goto(f"{BASE_URL}/login")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/2_login_page.png")

        # Step 2: Fill login credentials
        print("\n[Step 2] Filling login form...")
        try:
            # Locate input fields by placeholder or type
            email_input = page.locator("input[type='email'], input[placeholder*='Email'], input[placeholder*='Username']").first
            password_input = page.locator("input[type='password']").first
            
            await email_input.fill(USERNAME)
            await password_input.fill(PASSWORD)
            await page.screenshot(path=f"{SCREENSHOT_DIR}/3_credentials_filled.png")
            
            # Click sign in button
            submit_button = page.locator("button[type='submit'], button:has-text('Sign In'), button:has-text('Login')").first
            print("Clicking submit button...")
            await submit_button.click()
            await page.wait_for_timeout(5000) # Wait for network requests
            
            # Check current URL or check for profile token in localStorage
            token = await page.evaluate("() => localStorage.getItem('termii-token')")
            current_url = page.url
            print(f"Current URL after login attempt: {current_url}")
            print(f"Auth token in local storage: {token[:15] + '...' if token else 'None'}")
            
            await page.screenshot(path=f"{SCREENSHOT_DIR}/4_after_login_attempt.png")
            
            if token:
                print("SUCCESS: Logged in successfully!")
            else:
                print("FAILURE/WARNING: Auth token not found in localStorage. Check credentials or API health.")
        except Exception as e:
            print(f"Error during login: {e}")

        # Step 3: Social Feed / Home Page Analysis
        print("\n[Step 3] Navigating to Social Feed...")
        await page.goto(f"{BASE_URL}/feed")
        await page.wait_for_timeout(4000)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/5_feed_page.png")
        print("Feed page screenshot saved.")

        # Step 4: Test Creating a Post
        print("\n[Step 4] Navigating to Create Post page...")
        await page.goto(f"{BASE_URL}/create")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/6_create_post_page.png")
        
        try:
            textarea = page.locator("textarea[placeholder*='share'], textarea[placeholder*='write']").first
            if await textarea.is_visible():
                print("Filling post content...")
                await textarea.fill("QA functional check: testing the creation flow. #QA #Test")
                
                # Check for share button
                share_button = page.locator("button:has-text('Share'), button:has-text('Post'), button[type='submit']").first
                await page.screenshot(path=f"{SCREENSHOT_DIR}/7_post_content_filled.png")
                
                print("Clicking share button...")
                await share_button.click()
                await page.wait_for_timeout(5000)
                await page.screenshot(path=f"{SCREENSHOT_DIR}/8_after_post_share.png")
                print("Post creation step complete.")
            else:
                print("Create post textarea not visible/found.")
        except Exception as e:
            print(f"Error during post creation: {e}")

        # Step 5: Test Liking & Commenting
        print("\n[Step 5] Checking interaction elements on Feed...")
        await page.goto(f"{BASE_URL}/feed")
        await page.wait_for_timeout(4000)
        try:
            # Look for a like button
            like_button = page.locator("button:has-text('Like'), button svg").first
            if await like_button.is_visible():
                print("Toggling Like...")
                await like_button.click()
                await page.wait_for_timeout(2000)
                await page.screenshot(path=f"{SCREENSHOT_DIR}/9_after_like_toggle.png")
            
            # Look for comment input or view post button
            comment_button = page.locator("button:has-text('Comment'), button:has-text('Reply')").first
            if await comment_button.is_visible():
                print("Clicking comment/reply button...")
                await comment_button.click()
                await page.wait_for_timeout(2000)
                
                # Write a comment
                comment_input = page.locator("input[placeholder*='comment'], textarea[placeholder*='comment']").first
                if await comment_input.is_visible():
                    await comment_input.fill("QA test comment: Looks great!")
                    await comment_input.press("Enter")
                    await page.wait_for_timeout(3000)
                    await page.screenshot(path=f"{SCREENSHOT_DIR}/10_after_comment.png")
                    print("Comment added.")
        except Exception as e:
            print(f"Error during interaction tests: {e}")

        # Step 6: Profile Verification
        print("\n[Step 6] Navigating to Profile...")
        await page.goto(f"{BASE_URL}/profile")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/11_profile_page.png")
        print("Profile verification complete.")

        print("\nQA test run finished. Check the 'qa_screenshots' directory for output images.")
        await browser.close()

if __name__ == "__main__":
    print("Starting QA automation script using Playwright...")
    try:
        asyncio.run(run_qa_tests())
    except Exception as e:
        print(f"Automation execution failed: {e}")
        print("Tip: Make sure playwright is installed: pip install playwright && playwright install")
