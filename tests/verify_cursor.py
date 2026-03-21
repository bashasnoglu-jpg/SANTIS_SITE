import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        
        await page.goto("http://localhost:8080/tr/index.html")
        await page.wait_for_timeout(2000)
        
        # Move mouse to activate cursor-initialized
        await page.mouse.move(500, 500)
        await page.wait_for_timeout(100)
        
        is_init = await page.evaluate("() => document.body.classList.contains('cursor-initialized')")
        print(f"Cursor Initialized: {is_init}")
        
        # Test Text Hover
        title = page.locator("h2.hero-title")
        if await title.count() > 0:
            box = await title.bounding_box()
            await page.mouse.move(box['x'] + 10, box['y'] + 10)
            await page.wait_for_timeout(100)
            is_text = await page.evaluate("() => document.body.classList.contains('cursor-text-hover')")
            print(f"Text Hover Class Applied: {is_text}")
        
        # Test Snap Fusion
        cta = page.locator(".hero-cta")
        if await cta.count() > 0:
            box = await cta.bounding_box()
            await page.mouse.move(box['x'] + box['width']/2, box['y'] + box['height']/2)
            await page.wait_for_timeout(100)
            is_snap = await page.evaluate("() => document.body.classList.contains('cursor-snap-hover')")
            print(f"Snap Hover Class Applied: {is_snap}")
            
            # Test Micro-Compression (Mousedown)
            await page.mouse.down()
            await page.wait_for_timeout(100) # Give LERP frame time
            transform_down = await page.evaluate("() => document.getElementById('santis-cursor-ring').style.transform")
            print(f"Ring Transform on Mousedown: {transform_down}")
            await page.mouse.up()
            
        await browser.close()

asyncio.run(run())
