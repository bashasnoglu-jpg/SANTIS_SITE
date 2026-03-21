import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        
        await page.goto("http://localhost:8080/tr/index.html")
        await page.wait_for_timeout(2000)
        
        script = """
        () => {
            return {
                bodyOverflow: window.getComputedStyle(document.body).overflow,
                htmlOverflow: window.getComputedStyle(document.documentElement).overflow,
                hasLenis: !!window.lenis,
                hasLoco: !!window.locomotiveScroll,
                santisMainScroll: document.getElementById('santis-main').scrollTop
            }
        }
        """
        result = await page.evaluate(script)
        print("SCROLL ENVIRONMENT: ", result)

        await browser.close()

asyncio.run(run())
