import asyncio
import websockets

async def test_ws():
    try:
        async with websockets.connect("ws://localhost:8000/ws?client_type=site&client_id=test", ping_interval=None) as ws:
            print("Connected to WS successfully!")
            await ws.send('{"type":"ping"}')
            result = await ws.recv()
            print("Received from WS:", result)
    except Exception as e:
        print("WS Error:", e)

asyncio.run(test_ws())
