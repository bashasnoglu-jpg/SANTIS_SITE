import os
import asyncio
from pathlib import Path
from loguru import logger

try:
    import pyvips
except ImportError:
    logger.warning("pyvips is not installed or libvips is missing. Image Forge will fail if called.")

try:
    import numpy as np
    import cv2
    HAS_ML = True
except ImportError:
    logger.warning("numpy or cv2 (OpenCV) not installed. Falling back to center crop.")
    HAS_ML = False

_GALLERY_BASE_DIR = Path(__file__).resolve().parents[3] / "assets" / "img" / "cards"

def calculate_centroid_numpy(saliency_map, threshold=50):
    # 1. THE NOISE FILTER (Kuantum Eşikleme)
    ret, thresholded_map = cv2.threshold(saliency_map, threshold, 255, cv2.THRESH_TOZERO)
    T = thresholded_map.astype(np.float64)

    # Toplam Kütle (Sıfırıncı Moment: M00)
    M00 = np.sum(T)
    
    if M00 == 0:
        h, w = saliency_map.shape
        return w // 2, h // 2  # Tam orta nokta
        
    # 2. KOORDİNAT MATRİSLERİNİ YARATMAK (X ve Y Ekseni)
    y_indices, x_indices = np.indices(saliency_map.shape)

    # 3. BİRİNCİ MOMENTLER (Kütle Çarpımı)
    M10 = np.sum(x_indices * T)
    M01 = np.sum(y_indices * T)

    # 4. AĞIRLIK MERKEZİ (THE CENTROID)
    centroid_x = int(M10 / M00)
    centroid_y = int(M01 / M00)

    return centroid_x, centroid_y

def cognitive_luxury_crop(image: 'pyvips.Image', cx: int, cy: int) -> 'pyvips.Image':
    """
    Sovereign 4:5 Quiet Luxury Algorithm with AI-Centroid
    Görsel sınırlarını aşmadan, odak noktasını (cx, cy) merkeze alarak 4:5 oranında keser.
    """
    W_raw = image.width
    H_raw = image.height
    target_ratio = 0.80

    # 1. Maksimum Kırpma Kutusu
    W_crop = int(min(W_raw, H_raw * target_ratio))
    H_crop = int(min(H_raw, W_raw / target_ratio))

    # 2. X ve Y Eksenini Merkeze (Centroid) Oturtma
    X_crop = int(cx - (W_crop / 2))
    Y_crop = int(cy - (H_crop / 2))

    # 3. Sınır İhlallerini Önleme (Clamping - Kutunun dışarı taşmasını engeller)
    X_crop = max(0, min(X_crop, W_raw - W_crop))
    Y_crop = max(0, min(Y_crop, H_raw - H_crop))

    # PyVips'e fısıldıyoruz: "Burayı kes"
    return image.crop(X_crop, Y_crop, W_crop, H_crop)

def generate_sizes(image: 'pyvips.Image', base_name: str, out_dir: str):
    """
    Retina Matrix (320w, 640w, 960w) -> WebP (Q=80) & AVIF (Q=50)
    """
    sizes = [320, 640, 960]
    results = {}

    for size in sizes:
        scale = size / image.width
        
        # Lanczos3 resampling is highly optimized in pyvips
        resized = image.resize(scale)
        
        webp_path = os.path.join(out_dir, f"{base_name}_{size}w.webp")
        avif_path = os.path.join(out_dir, f"{base_name}_{size}w.avif")
        
        # WebP Output (Q=80)
        resized.webpsave(webp_path, Q=80)
        
        # AVIF Output (Q=50) - Fallback to webp if libvips built without AVIF/heif support
        has_avif = False
        try:
            resized.heifsave(avif_path, Q=50, compression="av1")
            has_avif = True
        except Exception as e:
            logger.warning(f"AVIF save failed (vips not compiled with heif av1 support): {e}")

        results[f"{size}w"] = {
            "webp": f"/assets/img/cards/{base_name}_{size}w.webp",
            "avif": f"/assets/img/cards/{base_name}_{size}w.avif" if has_avif else None
        }

    return results

async def process_image_pipeline(service_id: str, temp_path: str, base_name: str):
    """
    The Core Engine of Santis Image Forge V3
    Runs in an asyncio thread to prevent blocking FastAPI's Main Thread.
    """
    try:
        out_dir = str(_GALLERY_BASE_DIR)
        os.makedirs(out_dir, exist_ok=True)

        logger.info(f"🔥 [IMAGE FORGE] Processing started for {service_id} (Temp: {temp_path})")
        
        import pyvips
        # 1. Load image via zero-GC pipeline read (sequential access)
        img = await asyncio.to_thread(pyvips.Image.new_from_file, temp_path, access="sequential")
        
        # 2. Zeki Neşter (AI-Centroid)
        if HAS_ML:
            # Saliency simulation or actual extraction (using OpenCV here)
            # In production, you'd feed the image to a Saliency network.
            # Here we simulate by reading into CV2 and generating a map, or just static saliency.
            cv_img = await asyncio.to_thread(cv2.imread, temp_path, cv2.IMREAD_GRAYSCALE)
            if cv_img is not None:
                # Simülasyon: Geçici olarak tam ortayı hafif ofsetli seçiyoruz.
                # Gerçek AI modeli entegrasyonu (cv2.saliency vs) ileride kurulacak.
                saliency_map = np.ones_like(cv_img) * 100
                cy, cx = saliency_map.shape[0] // 2 - int(saliency_map.shape[0]*0.25), saliency_map.shape[1] // 2
            else:
                cx, cy = img.width // 2, img.height // 2
        else:
            # Fallback to Top 25% for vertical, Center for horizontal
            cx = img.width // 2
            cy = int(img.height * 0.25) if img.height > img.width else img.height // 2

        # 3. Smart Crop Mathematics
        cropped = await asyncio.to_thread(cognitive_luxury_crop, img, cx, cy)
        
        # 4. Retina Matrix Production
        variants = await asyncio.to_thread(generate_sizes, cropped, base_name, out_dir)
        
        logger.info(f"✨ [IMAGE FORGE] Processing completed. Retina Matrix 6x deployed for {service_id}")
        
        # 4. Clean up temp incoming raw file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        # 5. Neuro-Sync WebSocket Broadcast (O(1) update on clients)
        try:
            from app.core.sse_manager import sse_bus
            payload = {
                "event": "IMAGE_FORGED",
                "service_id": service_id,
                "variants": variants
            }
            await sse_bus.broadcast("santis_global_pulse", payload)
            logger.info("📡 [IMAGE FORGE] Neuro-Sync Broadcast fired successfully.")
        except Exception as e:
            logger.error(f"📡 [IMAGE FORGE] Failed to broadcast WebSocket event: {e}")
            
    except Exception as e:
        logger.error(f"❌ [IMAGE FORGE] Pipeline catastrophic failure for {service_id}: {e}")
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass

def forge_image(path: str):
    import pyvips
    import os
    
    # PyVips ile görseli aç
    image = pyvips.Image.new_from_file(path, access="sequential")
    
    # 4:5 lüks kırpma (statik orta veya saliency için)
    cx, cy = image.width // 2, image.height // 2
    
    # Kırpma
    cropped = cognitive_luxury_crop(image, cx, cy)
    
    # Retina Matrix üretimi
    base_name = os.path.splitext(os.path.basename(path))[0]
    out_dir = os.path.dirname(path)
    generate_sizes(cropped, base_name, out_dir)

