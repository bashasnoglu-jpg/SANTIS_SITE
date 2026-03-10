import asyncio
import httpx
import os
from loguru import logger

API_URL = "http://127.0.0.1:8000/api/v1/media/forge/upload"

async def test_forge_upload():
    # Geçici bir test resmi oluşturalım (eğer yoksa)
    test_img = "test_face.jpg"
    if not os.path.exists(test_img):
        # Basit bir dummy dosya (PyVips bunu okuyamaz ama API kabulünü test edebiliriz)
        with open(test_img, "wb") as f:
            f.write(b"dummy image data")
            
    logger.info("🚀 Sovereign Image Forge: Test Command Initiated")
    
    try:
        async with httpx.AsyncClient() as client:
            with open(test_img, "rb") as f:
                files = {"file": (test_img, f, "image/jpeg")}
                response = await client.post(API_URL, files=files)
                
            logger.info(f"📡 API Yanıt Kodu: {response.status_code}")
            logger.info(f"📡 API Yanıtı: {response.json()}")
            
            if response.status_code == 202:
                logger.success("✅ Yüz izni (ALLOW_FACE_USAGE = True) devrede! Pipeline başarıyla tetiklendi.")
            else:
                logger.error("❌ Hata! İstek reddedildi.")
                
    except Exception as e:
        logger.error(f"❌ Kuantum Köprüsünde (API) bağlantı hatası: {e}")
        logger.warning(f"FastAPI sunucusunun ({API_URL}) çalıştığından emin olun.")

if __name__ == "__main__":
    asyncio.run(test_forge_upload())
