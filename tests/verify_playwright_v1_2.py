import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_viewport_size({'width': 1920, 'height': 1080})
        print('Testing Sovereign Reveal v1.2...')
        await page.goto('http://localhost:8080/tr/index.html', wait_until='load')
        await page.wait_for_timeout(2000)
        
        print(f"Initial URL: {page.url}")
        
        # Test hardcoded card first
        first_card = page.locator('#sov-3d-stage .santis-stack-card').first
        await first_card.scroll_into_view_if_needed()
        print("Clicking first static card...")
        await first_card.click()
        await page.wait_for_timeout(500)
        await first_card.click() # Double click just in case logic needs it
        await page.wait_for_timeout(1000)
        
        ghost = page.locator('.santis-ghost-card.is-expanded')
        if await ghost.count() > 0:
            print('✅ Static Ghost card expanded successfully.')
            print(f"Current URL (Should have ?reveal=aura-aromaterapi): {page.url}")
            
            # Close it
            print("Pressing Escape to close...")
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(1000)
            print(f"After Close URL: {page.url}")
            if await page.locator('.santis-ghost-card').count() == 0:
                print('✅ Ghost card closed and removed from DOM cleanly.')
            else:
                print('❌ Ghost card NOT removed from DOM.')
        else:
            print('❌ Static Ghost card failed to expand.')
            
        # Test dynamic Cover Flow card
        dyn_card = page.locator('#santis-massage-matrix .santis-stack-card').nth(3) # Ensure nth(3) is visible in cover flow logic
        if await dyn_card.count() > 0:
            await dyn_card.scroll_into_view_if_needed()
            await dyn_card.click()
            await page.wait_for_timeout(800)
            await dyn_card.click() # Reveal
            await page.wait_for_timeout(1000)
            
            if await ghost.count() > 0:
                print('✅ Dynamic Ghost card expanded successfully.')
                print(f"Current URL: {page.url}")
            else:
                print('❌ Dynamic Ghost card failed to expand.')
        
        print('Done.')
        await browser.close()

asyncio.run(run())
