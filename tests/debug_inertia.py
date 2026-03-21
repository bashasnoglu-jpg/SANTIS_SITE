import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        
        await page.goto("http://localhost:8080/tr/index.html")
        await page.wait_for_timeout(2000)
        
        inertia_nodes = await page.evaluate("() => document.querySelectorAll('[data-inertia]').length")
        print(f"Nodes with data-inertia: {inertia_nodes}")
        
        inertia_engine_exists = await page.evaluate("() => !!window.inertiaEngine")
        print(f"Inertia Engine Exists: {inertia_engine_exists}")
        
        if inertia_engine_exists:
            engine_elements = await page.evaluate("() => window.inertiaEngine.elements.length")
            print(f"Inertia Engine internal elements count: {engine_elements}")
            
            is_mobile = await page.evaluate("() => window.matchMedia('(pointer: coarse)').matches")
            print(f"Is Mobile MatchMedia: {is_mobile}")

        await browser.close()

asyncio.run(run())
