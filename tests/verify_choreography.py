import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        
        await page.goto("http://localhost:8080/tr/index.html")
        await page.wait_for_timeout(2000)
        
        active_card = page.locator(".santis-stack-card.is-active").first
        if await active_card.count() > 0:
            print("Found active card, triggering Reveal...")
            
            # attach a console listener
            page.on("console", lambda msg: print(f"Browser console: {msg.text}"))
            
            # inject a custom transitionend tracker
            await page.evaluate("""() => {
                document.body.addEventListener('transitionend', (e) => {
                    if (e.target.classList.contains('santis-ghost-card')) {
                        console.log('TRANSITION END FIRE: ' + e.propertyName);
                    }
                }, true);
            }""")
            
            await active_card.click()
            await page.wait_for_timeout(2000)
            
            has_reveal = await page.evaluate("() => document.querySelector('.santis-ghost-card').classList.contains('reveal-content-active')")
            print(f"Ghost Card reveal-content-active: {has_reveal}")
            
        await browser.close()

asyncio.run(run())
