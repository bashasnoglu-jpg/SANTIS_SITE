#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
PROTOCOL 28: ZERO-GRAVITY SPEED STACK
The Preload Builder (Otonom Ajan)
----------------------------------
Bu ajan, agir 4K/HD videolari tarar, FAANG standartlarinda (30fps, %80 lossy webp) 
optimizasyondan gecirerek parcalar ve hedef HTML dosyasindaki `data-canvas-seq` 
ozniteligine sifir yercekimi hizinda otomatik enjekte eder.
"""

import os
import subprocess
import glob
import re
import argparse

# --- YAPILANDIRMA (CONFIG) ---
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DEFAULT_VIDEO = os.path.join(PROJECT_ROOT, 'assets', 'img', 'hero', 'hero-video.mp4') # Varsayilan video yolu
OUTPUT_DIR = os.path.join(PROJECT_ROOT, 'assets', 'hero-frames')
OUTPUT_URL_PREFIX = 'assets/hero-frames/' # HTML'e yazilacak yol (Santis standartlarina gore koku index'e relative)
TARGET_HTML = os.path.join(PROJECT_ROOT, 'index.html')

def build_frames(video_path, output_dir):
    print(f"🚀 [Preload Builder] Hedef Video Kilitlendi: {video_path}")
    os.makedirs(output_dir, exist_ok=True)
    
    # Eski kareleri temizle (Sifir Kalinti Politikasi)
    old_frames = glob.glob(os.path.join(output_dir, '*.webp'))
    for f in old_frames:
        os.remove(f)
    print(f"🧹 [Preload Builder] Eski kareler imha edildi ({len(old_frames)} dosya).")

    # The Sovereign FFmpeg Pipeline: 30 FPS, Lossy WebP (Quality 80)
    cmd = [
        'ffmpeg', '-y', '-i', video_path,
        '-vf', 'scale=1920:-1,fps=30',
        '-vcodec', 'libwebp', '-lossless', '0', '-q:v', '80',
        '-preset', 'default', '-an',
        os.path.join(output_dir, 'frame_%04d.webp')
    ]
    
    print(f"🎬 [Preload Builder] FFmpeg Nöral Motoru Atesleniyor... Lutfen bekleyin.")
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        print(f"🚨 [Preload Builder] FFmpeg Cöküsü: Lutfen sisteminizde FFmpeg'in kurulu oldugundan emin olun.")
        return None
    
    frames = sorted(os.listdir(output_dir))
    frame_urls = [f"{OUTPUT_URL_PREFIX}{f}" for f in frames if f.endswith('.webp')]
    print(f"✅ [Preload Builder] Basarili! {len(frame_urls)} adet hafif WebP karesi RAM on-yuklemesi icin uretildi.")
    return frame_urls

def inject_to_html(html_path, frame_urls):
    if not os.path.exists(html_path):
        print(f"⚠️ [Preload Builder] Hedef HTML bulunamadi: {html_path}")
        return

    print(f"💉 [Preload Builder] DOM Enjeksiyonu Basliyor: {html_path}")
    seq_string = ",".join(frame_urls)
    
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex: data-canvas-seq="..." kismini bul ve icini tamamen yeni url serisiyle degistir
    pattern = r'(data-canvas-seq\s*=\s*")([^"]*)(")'
    new_content, count = re.subn(pattern, rf'\g<1>{seq_string}\g<3>', content)

    if count > 0:
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✅ [Preload Builder] DOM Enjeksiyonu Basarili! Toplam {count} hedefe frame dizisi basildi.")
    else:
        print(f"⚠️ [Preload Builder] HTML'de hedeflenecek 'data-canvas-seq' ozniteligi bulunamadi.")
        print('Lutfen HTML icine <canvas data-canvas-hero data-canvas-seq=""></canvas> seklinde ekleyin.')

def main():
    parser = argparse.ArgumentParser(description="Santis OS Preload Builder Ajanı (Protocol 28)")
    parser.add_argument('--video', type=str, default=DEFAULT_VIDEO, help='Kaynak video yolu (Orn: assets/raw/hero.mp4)')
    parser.add_argument('--html', type=str, default=TARGET_HTML, help='Enjekte edilecek HTML dosyasi')
    parser.add_argument('--out', type=str, default=OUTPUT_DIR, help='Cikti karelerinin kaydedilecegi klasor')
    
    args = parser.parse_args()
    
    print("="*60)
    print(" 🍷 THE WAR ROOM: PROTOCOL 28 - PRELOAD BUILDER AKTİF 🍷")
    print("="*60)

    if not os.path.exists(args.video):
        print(f"❌ [Preload Builder] Kritik Hata: Kaynak video dosyasi bulunamadi! ({args.video})")
        print("Parametre vererek calistirin: python tools/preload_builder.py --video yol/video.mp4")
    else:
        urls = build_frames(args.video, args.out)
        if urls:
            inject_to_html(args.html, urls)
    
    print("="*60)
    print(" 🚀 OPERASYON TAMAMLANDI: ZERO-GRAVITY DEVREDE 🚀")
    print("="*60)

if __name__ == "__main__":
    main()
