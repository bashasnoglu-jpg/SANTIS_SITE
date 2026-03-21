import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        
        await page.goto("http://localhost:8080/tr/index.html")
        await page.wait_for_timeout(2000)
        
        html = await page.evaluate("() => document.querySelector('.hero-visual') ? document.querySelector('.hero-visual').outerHTML : 'NOT_FOUND'")
        print("Hero Image Outer HTML: ", html)

        await browser.close()

asyncio.run(run())
