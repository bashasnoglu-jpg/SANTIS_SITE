import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_viewport_size({'width': 1920, 'height': 1080})
        print('Navigating to index.html...')
        await page.goto('http://localhost:8080/tr/index.html', wait_until='load')
        await page.wait_for_timeout(2000)
        
        # Test 1: Hardcoded Stage
        print('\n--- TEST 1: Hardcoded Stage (#sov-3d-stage-elements) ---')
        stage1 = page.locator('#sov-3d-stage-elements')
        await stage1.scroll_into_view_if_needed()
        await page.wait_for_timeout(1000)
        
        cards1 = stage1.locator('.santis-stack-card')
        count1 = await cards1.count()
        print(f'Found {count1} cards in Stage 1.')
        
        # Click the active card (usually index 0 or 1 is closest to center)
        card_to_click = cards1.nth(1)
        await card_to_click.click() # Centers the card
        await page.wait_for_timeout(800)
        await card_to_click.click() # Expands the card
        await page.wait_for_timeout(1000) # Wait for expansion
        
        # Check Ghost Card
        ghost = page.locator('.santis-ghost-card.is-expanded')
        if await ghost.count() > 0:
            print('✅ Ghost card 1 expanded successfully.')
            
            # Check inline styles
            filter_val = await ghost.evaluate('el => el.style.filter')
            opacity_val = await ghost.evaluate('el => el.style.opacity')
            print(f'Ghost Card 1 Inline Filter: "{filter_val}" (Expected: "none")')
            print(f'Ghost Card 1 Inline Opacity: "{opacity_val}" (Expected: "1")')
            
            # Check Data visibility
            data = ghost.locator('.santis-reveal-data')
            if await data.is_visible():
                print('✅ Reveal data 1 is VISIBLE inside the ghost card.')
            else:
                print('❌ Reveal data 1 is NOT visible.')
            
            # Close it
            await page.locator('.santis-ghost-close').click()
            await page.wait_for_timeout(1000)
        else:
            print('❌ Ghost card 1 failed to expand.')
            
        # Test 2: Dynamic Stage (Massage)
        print('\n--- TEST 2: Dynamic Stage (#santis-massage-matrix) ---')
        stage2 = page.locator('#santis-massage-matrix')
        await stage2.scroll_into_view_if_needed()
        await page.wait_for_timeout(1000)
        
        cards2 = stage2.locator('.santis-stack-card')
        count2 = await cards2.count()
        print(f'Found {count2} cards in Stage 2.')
        
        card_to_click2 = cards2.nth(2)
        await card_to_click2.click() # Center
        await page.wait_for_timeout(800)
        await card_to_click2.click() # Expand
        await page.wait_for_timeout(1000) # Wait for expansion
        
        ghost2 = page.locator('.santis-ghost-card.is-expanded')
        if await ghost2.count() > 0:
            print('✅ Ghost card 2 expanded successfully.')
            
            filter_val = await ghost2.evaluate('el => el.style.filter')
            opacity_val = await ghost2.evaluate('el => el.style.opacity')
            print(f'Ghost Card 2 Inline Filter: "{filter_val}" (Expected: "none")')
            print(f'Ghost Card 2 Inline Opacity: "{opacity_val}" (Expected: "1")')
            
            # Check Data visibility
            data2 = ghost2.locator('.santis-reveal-data')
            if await data2.is_visible():
                print('✅ Reveal data 2 is VISIBLE inside the ghost card.')
            else:
                print('❌ Reveal data 2 is NOT visible.')
                
            await page.locator('.santis-ghost-close').click()
            await page.wait_for_timeout(1000)
        else:
            print('❌ Ghost card 2 failed to expand.')
            
        print('\n✅ Automated Verification Complete.')
        await browser.close()
asyncio.run(run())
