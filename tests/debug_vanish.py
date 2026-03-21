import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--window-size=1920,1080"])
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        
        await page.goto("http://localhost:8080/cilt-bakimi.html")
        await page.wait_for_timeout(2000)
        
        # Click the first card
        # The cards are inside .santis-carousel-stage
        card = page.locator(".santis-carousel-stage .santis-stack-card").first
        await card.click(force=True)
        await page.wait_for_timeout(1000)
        
        ghost = page.locator(".santis-ghost-card")
        if await ghost.count() > 0:
            html = await ghost.evaluate("el => el.outerHTML")
            box = await ghost.bounding_box()
            print("GHOST OUTER HTML: ", html)
            print("GHOST BOUNDS: ", box)
        else:
            print("GHOST CARD NOT FOUND IN DOM!")

        overlay = page.locator(".santis-ghost-overlay")
        if await overlay.count() > 0:
            print("OVERLAY visibility: ", await overlay.evaluate("el => window.getComputedStyle(el).opacity"))
            
        await browser.close()

asyncio.run(run())
