
import sys
import asyncio

print(f"Python: {sys.version}")

try:
    from playwright.async_api import async_playwright
    print("✅ Playwright module found.")
except ImportError:
    print("❌ Playwright module NOT found.")
    sys.exit(1)

async def check_browser():
    async with async_playwright() as p:
        try:
            browser = await p.chromium.launch()
            print("✅ Chromium launched successfully.")
            await browser.close()
        except Exception as e:
            print(f"❌ Chromium launch failed: {e}")

if __name__ == "__main__":
    asyncio.run(check_browser())
