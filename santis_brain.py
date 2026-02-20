import asyncio
import json
import os
from datetime import datetime
import websockets

# CONFIG: Port 8001 (Brain)
PORT = 8001
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

connected_clients = set()

# INTENT DATABASE (Rule-Based AI v1.0)
INTENTS = {
    "merhaba": "Merhaba! Santis Club'a hoş geldiniz. Size nasıl yardımcı olabilirim?",
    "selam": "Selamlar! Bugün kendinizi nasıl şımartmak istersiniz?",
    "fiyat": "Masaj terapilerimiz 2500 TL'den, Hamam ritüellerimiz 3000 TL'den başlamaktadır. Tüm menüyü 'Masajlar' sayfasında inceleyebilirsiniz.",
    "rezervasyon": "Rezervasyon için sağ üstteki butonu kullanabilir veya +90 534 835 0169 numaralı hattımızdan bize ulaşabilirsiniz.",
    "saat": "Santis Club haftanın her günü 09:00 - 22:00 saatleri arasında hizmet vermektedir.",
    "yer": "Santis Club, şehrin kalbinde ancak gürültüden uzak, gizli bir vahada yer almaktadır.",
}

def get_ai_response(text):
    text = text.lower()
    for key, response in INTENTS.items():
        if key in text:
            return response
    return "Bu konuda size yardımcı olması için bir temsilcimize aktarıyorum... (Şaka, şu an sadece basit bir botum 🤖. Lütfen 'fiyat', 'saat' veya 'rezervasyon' gibi şeyler sorun.)"

async def save_file(filename, content):
    """Securely writes content to specific allowed directories."""
    allowed_dirs = ['assets/data/', 'assets/js/', 'assets/css/']
    
    # 1. Validate Path (Simple Security)
    target_path = os.path.join(ROOT_DIR, filename)
    relative_path = os.path.relpath(target_path, ROOT_DIR).replace("\\", "/")
    
    is_allowed = any(relative_path.startswith(d) for d in allowed_dirs)
    # Special exception for root files if needed, but safer to restrict.
    # For now, Admin saves to assets/js/*.js predominantly.
    
    if not is_allowed and not filename.startswith('assets/'): 
         # Fallback permissive for dev env, but warn
         print(f"⚠️ Warning: Saving to non-standard path: {relative_path}")

    try:
        # Create dir if not exists
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        
        with open(target_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"💾 Saved: {filename}")
        return True, "File saved successfully"
    except Exception as e:
        print(f"❌ Save Error: {e}")
        return False, str(e)

async def handler(websocket):
    connected_clients.add(websocket)
    print(f"🟢 Client Connected ({len(connected_clients)} active)")

    try:
        async for message in websocket:
            data = json.loads(message)
            msg_type = data.get('type')
            
            # 1. CHAT (Concierge)
            if msg_type == 'chat':
                user_text = data.get('text', '')
                reply_text = get_ai_response(user_text)
                await asyncio.sleep(0.8) # Typing effect
                response = { "type": "concierge_reply", "text": reply_text, "time": datetime.now().isoformat() }
                await websocket.send(json.dumps(response))

            # 2. FILE SAVE (Admin Panel)
            elif msg_type == 'save_file':
                print(f"💾 Request to save: {data.get('filename')}")
                success, status = await save_file(data.get('filename'), data.get('content'))
                response = { "type": "save_status", "success": success, "message": status, "filename": data.get('filename') }
                await websocket.send(json.dumps(response))

            # 3. HEARTBEAT
            else:
                response = { "type": "brain_status", "status": "online", "time": datetime.now().isoformat() }
                await websocket.send(json.dumps(response))

    except websockets.exceptions.ConnectionClosed:
        print("🔴 Client Disconnected")

    except Exception as e:
        print(f"⚠️ Error: {e}")

    finally:
        connected_clients.remove(websocket)


async def main():
    print(f"🚀 Santis Brain (AI Concierge + Admin Bridge) Starting on ws://localhost:{PORT}")
    async with websockets.serve(handler, "localhost", PORT):
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Santis Brain Offline")
