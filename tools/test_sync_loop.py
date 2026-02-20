import asyncio
import websockets
import json
import requests
import sys

async def test_sync_loop():
    uri = "ws://localhost:8000/ws"
    print(f"🔌 Connecting to Neural Bridge at {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket Connected!")
            
            # trigger save via HTTP
            print("💾 Triggering Save via HTTP POST...")
            url = "http://localhost:8000/api/save"
            payload = {
                "filename": "assets/js/sync_probe_home_data.js",
                "content": "// Test Content"
            }
            
            try:
                r = requests.post(url, json=payload)
                print(f"📡 API Response: {r.status_code} {r.json()}")
            except Exception as e:
                print(f"❌ HTTP Post Failed: {e}")
                return

            print("⏳ Waiting for Sync Signal (5s timeout)...")
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(message)
                print(f"🔥 RECEIVED SIGNAL: {data}")
                
                if data.get("type") == "update" or "file" in data:
                    print("\n🚀 LIVE SYNC SUCCESS! Protocol is working.")
                else:
                    print("\n⚠️ Signal received but structure unclear.")
                    
            except asyncio.TimeoutError:
                print("\n❌ TIMEOUT: No signal received from server.")
                
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(test_sync_loop())
    except ImportError:
        print("❌ 'websockets' library not installed. Cannot run automated test.")
        print("Please use the browser console method: runLiveSyncTest()")
