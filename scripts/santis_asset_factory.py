import os
from pathlib import Path
from PIL import Image, ImageOps

def create_pwa_assets(master_path: str, output_dir: str):
    root = Path(master_path).resolve()
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    if not root.exists():
        print(f"❌ Master logo bulunamadı: {root}")
        return

    # Master imajı aç ve arka planı Vanta-Black (#000000) yap
    with Image.open(root) as img:
        img = img.convert("RGBA")
        
        # 1. Standart İkonlar (192, 512)
        sizes = [192, 512]
        for size in sizes:
            icon = img.resize((size, size), Image.Resampling.LANCZOS)
            icon.save(out / f"icon-{size}.png")
            print(f"✅ Üretildi: icon-{size}.png")

        # 2. Maskable Icon (Padding eklenmiş 512)
        # Google Play/Android için %20 güvenli alan bırakır
        maskable_size = 512
        padding = int(maskable_size * 0.2)
        maskable = Image.new("RGBA", (maskable_size, maskable_size), (0, 0, 0, 255))
        resized_logo = img.resize((maskable_size - 2*padding, maskable_size - 2*padding), Image.Resampling.LANCZOS)
        maskable.paste(resized_logo, (padding, padding), resized_logo)
        maskable.save(out / "maskable-512.png")
        print(f"✅ Üretildi: maskable-512.png")

        # 3. Sovereign Splash Screen (iPhone 15 Pro Max Standardı)
        splash_w, splash_h = 1290, 2796
        splash = Image.new("RGBA", (splash_w, splash_h), (0, 0, 0, 255))
        # Logoyu splash ekranının ortasına yerleştir
        logo_w = 400
        logo_h = int(img.height * (logo_w / img.width))
        centered_logo = img.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
        splash.paste(centered_logo, ((splash_w - logo_w) // 2, (splash_h - logo_h) // 2), centered_logo)
        splash.save(out / "apple-splash-2796.png")
        print(f"👑 Sovereign Splash Hazır: apple-splash-2796.png")

if __name__ == "__main__":
    # Kullanım: master-logo.png dosyasını root'a at ve çalıştır
    create_pwa_assets("assets/img/master-logo.png", "assets/img/icons")
