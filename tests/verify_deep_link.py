import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        # Set exact screen size
        await page.set_viewport_size({'width': 1920, 'height': 1080})
        
        # page.on("console", lambda msg: print(f"Browser console: {msg.text}"))
        print('Testing Deep Link: ?reveal=aura-aromaterapi...')
        await page.goto('http://localhost:8080/tr/index.html?reveal=aura-aromaterapi', wait_until='load')
        await page.wait_for_timeout(3000)
        
        ghost = page.locator('.santis-ghost-card.is-expanded')
        if await ghost.count() > 0:
            print('✅ Deep Link Ghost card auto-expanded successfully upon page load.')
            box = await ghost.bounding_box()
            print(f'Ghost Card Computed Bounding Box: {box}')
            
            if box["width"] == 1920 and box["height"] == 1080:
                print('🚀 SUCCESS: Ghost Card perfectly filled the 100vw/100vh canvas.')
            else:
                print('❌ FAILED: Ghost card did NOT reach 1920x1080!')
        else:
            print('❌ Deep Link failed to trigger Sovereign Reveal.')
            
        print('Done.')
        await browser.close()

asyncio.run(run())
