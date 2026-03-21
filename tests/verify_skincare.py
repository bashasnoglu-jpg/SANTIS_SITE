import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_viewport_size({'width': 1920, 'height': 1080})
        
        urls_to_test = [
            'http://localhost:8080/cilt-bakimi.html',
            'http://localhost:8080/tr/cilt-bakimi.html'
        ]
        
        for url in urls_to_test:
            print(f'\\nTesting {url}...')
            try:
                await page.goto(url, wait_until='load')
                await page.wait_for_timeout(2000)
            except Exception as e:
                print(f'Failed to load {url}: {e}')
                continue
            
            cards = page.locator('.santis-stack-card')
            count = await cards.count()
            print(f'Found {count} cards here.')
            
            if count > 0:
                c = cards.nth(int(count/2))
                await c.scroll_into_view_if_needed()
                await page.wait_for_timeout(1000)
                await c.click()
                await page.wait_for_timeout(800)
                await c.click()
                await page.wait_for_timeout(1000)
                
                ghost = page.locator('.santis-ghost-card.is-expanded')
                if await ghost.count() > 0:
                    print('✅ Ghost card expanded successfully.')
                    fil = await ghost.evaluate('el => el.style.filter')
                    op = await ghost.evaluate('el => el.style.opacity')
                    print(f'Filter: "{fil}" | Opacity: "{op}"')
                    if await ghost.locator('.santis-reveal-data').is_visible():
                        print('✅ Reveal data is VISIBLE.')
                    else:
                        print('❌ Reveal data NOT visible.')
                else:
                    print('❌ Ghost card failed to expand.')
                
        print('\\nDone.')
        await browser.close()
asyncio.run(run())
