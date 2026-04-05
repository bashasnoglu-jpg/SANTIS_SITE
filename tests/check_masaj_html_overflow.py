import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1400, "height": 900})
        
        await page.goto('http://localhost:8080/masaj.html')
        await page.wait_for_selector('.santis-carousel-stage .santis-stack-card')
        
        # Scroll to the carousel
        await page.evaluate("document.querySelector('.santis-carousel-stage').scrollIntoView({block: 'center'})")
        
        # Wait for the animation to settle
        await page.wait_for_timeout(2000)
        
        # Take a screenshot
        screenshot_path = os.path.join(os.environ.get('USERPROFILE', ''), ".gemini", "antigravity", "brain", "47578fb7-a27a-4a6b-8745-f2d7d4a73a1d", "check_masaj_html_overflow_fix.png")
        await page.screenshot(path=screenshot_path, type='png')
        print(f"Screenshot saved to {screenshot_path}")
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
