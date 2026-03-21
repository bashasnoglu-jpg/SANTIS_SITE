import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        
        await page.goto("http://localhost:8080/tr/index.html")
        await page.wait_for_timeout(2000)
        
        y1 = await page.evaluate("() => window.scrollY")
        
        await page.evaluate("window.scrollBy(0, 500)")
        await page.wait_for_timeout(500)
        
        y2 = await page.evaluate("() => window.scrollY")
        print(f"ScrollY before: {y1}, ScrollY after: {y2}")

        await browser.close()

asyncio.run(run())
