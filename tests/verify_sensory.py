import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--window-size=1920,1080"])
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"BROWSER ERROR: {err}"))

        await page.goto("http://localhost:8080/tr/index.html")
        await page.wait_for_timeout(2000)
        
        print("--- PHASE 3: MAGNETIC ENGINE VALIDATION ---")
        cta = page.locator(".hero-cta")
        if await cta.count() > 0:
            box = await cta.bounding_box()
            cx = box['x'] + box['width'] / 2
            cy = box['y'] + box['height'] / 2
            
            # Move exact center
            await page.mouse.move(cx, cy)
            await page.wait_for_timeout(100)
            mx_center = await cta.evaluate("el => el.style.getPropertyValue('--mx')")
            my_center = await cta.evaluate("el => el.style.getPropertyValue('--my')")
            print(f"CTA at Center -> mx: '{mx_center}', my: '{my_center}'")
            
            # Move 50px right and 50px down from center (within radius)
            await page.mouse.move(cx + 50, cy + 50)
            await page.wait_for_timeout(100)
            mx_pull = await cta.evaluate("el => el.style.getPropertyValue('--mx')")
            my_pull = await cta.evaluate("el => el.style.getPropertyValue('--my')")
            print(f"CTA at +50 Pull -> mx: '{mx_pull}', my: '{my_pull}'")
        else:
            print("Hero CTA not found!")
            
        print("\\n--- PHASE 4: INERTIA ENGINE VALIDATION ---")
        hero_bg = page.locator(".hero-visual")
        if await hero_bg.count() > 0:
            transform_init = await hero_bg.evaluate("el => el.style.transform")
            print(f"Hero Image Initial Transform: '{transform_init}'")
            
            # Scroll down
            await page.evaluate("window.scrollBy(0, 300)")
            await page.wait_for_timeout(500)
            
            transform_scrolled = await hero_bg.evaluate("el => el.style.transform")
            print(f"Hero Image After 300px Scroll Transform: '{transform_scrolled}'")
        else:
            print("Hero Background visual not found!")

        await browser.close()

asyncio.run(run())
