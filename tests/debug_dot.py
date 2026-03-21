import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        
        await page.goto("http://localhost:8080/tr/index.html")
        await page.wait_for_timeout(2000)
        
        dot_exists = await page.evaluate("() => !!document.getElementById('santis-cursor-dot')")
        print(f"Dot Exists: {dot_exists}")
        
        if not dot_exists:
            html = await page.evaluate("() => document.body.innerHTML.substring(document.body.innerHTML.length - 1000)")
            print("Last 1000 chars of body:", html)
            
        await browser.close()

asyncio.run(run())
