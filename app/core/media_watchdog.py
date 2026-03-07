import os
import shutil
import asyncio
from pathlib import Path
from PIL import Image
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import logging

# Logger Setup
logger = logging.getLogger("santis_media_watchdog")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s | %(levelname)-8s | %(name)-25s | %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

IMAGE_DIR = Path("assets/img")
BACKUP_DIR = Path("_dev_archives/originals")
QUALITY = 82
MIN_SIZE_KB = 150

class SantisAssetHandler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory:
            filepath = Path(event.src_path)
            # Sadece yeni gelen jpg ve png dosyalarını dinle
            if filepath.suffix.lower() in ['.png', '.jpg', '.jpeg']:
                logger.info(f"[Watchdog] ⚠️ Yeni ağır görsel tespit edildi: {filepath.name}")
                self.trigger_sovereign_compression(filepath)

    def trigger_sovereign_compression(self, filepath: Path):
        # Dosyanın sisteme tamamen yazılmasını garantilemek için gecikme.
        # Senkron çalışır çünkü Watchdog ayrı thread'dedir.
        import time
        time.sleep(2.5)  # Artırıldı: 1.0 → 2.5s (büyük upload stream'leri için)

        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Dosya var mı kontrolü (race condition: silindi/taşındı olabilir)
                if not filepath.exists():
                    logger.debug(f"[Watchdog] ⏭️ {filepath.name} artık mevcut değil, atlanıyor.")
                    return

                original_size = filepath.stat().st_size

                if original_size < (MIN_SIZE_KB * 1024):
                    logger.info(f"[Watchdog] ⏭️ {filepath.name} ({original_size/1024:.1f} KB) 150KB altında, bypass ediliyor.")
                    return

                webp_path = filepath.with_suffix('.webp')

                if not BACKUP_DIR.exists():
                    BACKUP_DIR.mkdir(parents=True)

                # Dönüştür
                with Image.open(filepath) as img:
                    img.save(webp_path, "WEBP", quality=QUALITY, method=6)

                new_size = webp_path.stat().st_size

                if new_size < original_size:
                    relative_path = filepath.relative_to(IMAGE_DIR)
                    backup_file_path = BACKUP_DIR / relative_path
                    backup_file_path.parent.mkdir(parents=True, exist_ok=True)

                    shutil.move(str(filepath), str(backup_file_path))
                    logger.info(f"[Watchdog] ✅ Otonom Optimizasyon: {filepath.name} -> {webp_path.name} (Tasarruf: {(original_size - new_size)/1024:.1f} KB)")
                else:
                    webp_path.unlink(missing_ok=True)
                    logger.info(f"[Watchdog] ⏭️ {filepath.name} WebP olunca daha büyük oldu, bypass ediliyor.")

                break  # Başarılı — döngüden çık

            except FileNotFoundError:
                # Dosya silindi/taşındı — sessizce atla, retry'a gerek yok
                logger.debug(f"[Watchdog] ⏭️ {filepath.name} bulunamadı (muhtemelen geçici dosya), atlanıyor.")
                return

            except PermissionError as pe:
                if attempt < max_retries - 1:
                    logger.warning(f"[Watchdog] ⏳ Dosya kilitli ({filepath.name}), yeniden deneniyor ({attempt+1}/{max_retries})...")
                    import time
                    time.sleep(2.0)
                else:
                    logger.error(f"[Watchdog] ❌ Hata ({filepath.name}): {pe}")

            except Exception as e:
                logger.error(f"[Watchdog] ❌ Beklenmeyen Hata ({filepath.name}): {e}")
                if attempt < max_retries - 1:
                    import time
                    time.sleep(1.5)
                # NOT: artık 'break' yok — tüm hatalar için retry denenir

        # Dosyanın sisteme tamamen yazılmasını garantilemek için minik bir gecikme
        # Senkron çalışır çünkü Watchdog ayrı thread'dedir
        import time
        time.sleep(1.0) 

        max_retries = 3
        for attempt in range(max_retries):
            try:
                import time
                if not filepath.exists():
                    return
                    
                original_size = filepath.stat().st_size
                
                if original_size < (MIN_SIZE_KB * 1024):
                    logger.info(f"[Watchdog] ⏭️ {filepath.name} ({original_size/1024:.1f} KB) 150KB altında, bypass ediliyor.")
                    return

                webp_path = filepath.with_suffix('.webp')
                
                if not BACKUP_DIR.exists():
                    BACKUP_DIR.mkdir(parents=True)
                    
                # Dönüştür
                with Image.open(filepath) as img:
                    img.save(webp_path, "WEBP", quality=QUALITY, method=6)
                    
                new_size = webp_path.stat().st_size
                
                if new_size < original_size:
                    relative_path = filepath.relative_to(IMAGE_DIR)
                    backup_file_path = BACKUP_DIR / relative_path
                    backup_file_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    shutil.move(str(filepath), str(backup_file_path))
                    logger.info(f"[Watchdog] ✅ Otonom Optimizasyon: {filepath.name} -> {webp_path.name} (Tasarruf: {(original_size - new_size)/1024:.1f} KB)")
                else:
                    webp_path.unlink()
                    logger.info(f"[Watchdog] ⏭️ {filepath.name} WebP olunca daha büyük oldu, bypass ediliyor.")
                
                break # Success, break out of retry loop
            except PermissionError as pe:
                if attempt < max_retries - 1:
                    logger.warning(f"[Watchdog] ⏳ Dosya kilitli ({filepath.name}), yeniden deneniyor ({attempt+1}/{max_retries})...")
                    import time
                    time.sleep(2.0)
                else:
                    logger.error(f"[Watchdog] ❌ Hata ({filepath.name}): {pe}")
            except Exception as e:
                logger.error(f"[Watchdog] ❌ Beklenmeyen Hata ({filepath.name}): {e}")
                break

_observer = None

def start_media_watchdog():
    """Starts the background media watchdog thread"""
    global _observer
    if _observer is not None:
        return
        
    if not IMAGE_DIR.exists():
        IMAGE_DIR.mkdir(parents=True)

    event_handler = SantisAssetHandler()
    _observer = Observer()
    _observer.schedule(event_handler, str(IMAGE_DIR), recursive=True)
    _observer.start()
    logger.info("🛡️ Santis Media Watchdog: Başlatıldı. assets/img dinleniyor.")

def stop_media_watchdog():
    """Stops the watchdog"""
    global _observer
    if _observer:
        _observer.stop()
        _observer.join()
        _observer = None
        logger.info("🛡️ Santis Media Watchdog: Kapatıldı.")

if __name__ == "__main__":
    start_media_watchdog()
    print("Watchdog çalışıyor... Çıkmak için Ctrl+C'ye basın.")
    try:
        import time
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        stop_media_watchdog()
