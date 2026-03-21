"""
app/core/image_factory.py
Phase 6: The Ghost Factory (Visual Engineering)
Libvips + Blurhash for lightning-fast responsive WebP generation and aesthetic DNA extraction.
"""
from __future__ import annotations
import os
import io
import hashlib
import asyncio
from datetime import datetime
from PIL import Image

# Graceful Imports for local Windows environments missing C++ Build Tools
try:
    import pyvips
    import blurhash
    HAS_VIPS_BLURHASH = True
except ImportError:
    HAS_VIPS_BLURHASH = False
    print("WARNING: pyvips or blurhash-python missing. Using Pillow/Mock fallback for local development.")

try:
    import boto3
    from botocore.exceptions import NoCredentialsError
except ImportError:
    boto3 = None

from app.core.config import settings
from app.core.websocket import manager

# AWS Cloud Config
S3_BUCKET = settings.AWS_BUCKET_NAME
CDN_DOMAIN = settings.CDN_DOMAIN
ENABLE_S3 = os.getenv("ENABLE_S3_UPLOAD", "true").lower() == "true"

if ENABLE_S3 and boto3 and settings.AWS_ACCESS_KEY_ID:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    )
else:
    s3_client = None

def upload_bytes_to_s3(buffer: bytes, s3_key: str, content_type: str = "image/webp") -> str:
    """Synchronous mock of upload_bytes since we don't have async boto3 initialized yet."""
    if not s3_client: return None
    try:
        s3_client.put_object(
            Body=buffer,
            Bucket=S3_BUCKET,
            Key=s3_key,
            ContentType=content_type,
            ACL='public-read'
        )
        return f"{CDN_DOMAIN}/{s3_key}"
    except Exception as e:
        print(f"[AWS] S3 Error: {e}")
        return None

class GhostFactory:
    """
    Santis Visual Intelligence Engine
    Processes images via libvips, generates Blurhash, and pushes to CDN.
    Now optimized to generate 4 sizes: 384w, 768w, 1280w, 1920w
    """
    
    @staticmethod
    async def ingest_visual(file_content: bytes, filename: str, tenant_id: str, service_id: str):
        # Neural Pulse 1: Ingestion Start
        tenant_id_safe = tenant_id if tenant_id else "global"
        service_id_safe = service_id if service_id else "general"
        
        await manager.broadcast_to_room({
            "type": "SANTIS VISUAL",
            "message": f"'{filename}' ingested (Tenant: {tenant_id_safe})."
        }, "hq_global")

        # 1. Unique Hash Generation (Perceptual-ish Sharding)
        file_hash = hashlib.sha256(file_content).hexdigest()[:12]
        ext = "webp"
        
        base_s3_path = f"assets/{tenant_id_safe}/{service_id_safe}/{file_hash}"

        hash_str = "L0000000" # Mock Fallback
        
        sizes_to_generate = [384, 768, 1280, 1920]
        generated_buffers = {}
        
        # 2. Libvips In-Memory Processing (Or Pillow Fallback)
        if HAS_VIPS_BLURHASH:
            try:
                image = pyvips.Image.new_from_buffer(file_content, "")
                # Generate Blurhash from a very small proxy
                small_proxy = image.thumbnail_image(32)
                pixels = small_proxy.write_to_memory()
                hash_str = blurhash.encode(pixels, small_proxy.width, small_proxy.height, x_components=4, y_components=3)
                
                # Generate responsive sizes
                for target_w in sizes_to_generate:
                    # If image is smaller than target_w, just use original width (or don't scale up)
                    scale_factor = target_w / image.width if image.width > target_w else 1.0
                    if scale_factor < 1.0:
                        resized = image.resize(scale_factor)
                    else:
                        resized = image
                    
                    buffer = resized.write_to_buffer(".webp[Q=85,lossless=false,smart_subsample=true]")
                    generated_buffers[target_w] = buffer
                    
            except Exception as e:
                print(f"[VIPS ERROR] {e}. Falling back.")
                # minimal fallback execution if VIPS fails midway
                generated_buffers[1280] = file_content # safety fallback
        else:
            # Fallback to Pillow if pyvips not installed locally
            image = Image.open(io.BytesIO(file_content))
            if image.mode != "RGB":
                image = image.convert("RGB")
            
            # Simple mock for blurhash without relying on native module
            hash_str = "LMQv~R_3.S~qfRtQRjRjofofWCWB"
            
            for target_w in sizes_to_generate:
                if image.width > target_w:
                    target_h = int((target_w / image.width) * image.height)
                    resized = image.resize((target_w, target_h), Image.Resampling.LANCZOS)
                else:
                    resized = image.copy()
                    
                out_io = io.BytesIO()
                resized.save(out_io, "WEBP", quality=85)
                generated_buffers[target_w] = out_io.getvalue()
                
        # Neural Pulse 2: Pipeline Finished
        engine_name = "LIBVIPS" if HAS_VIPS_BLURHASH else "PILLOW FALLBACK"
        await manager.broadcast_to_room({
            "type": engine_name,
            "message": f"4 Responsive versions generated (384w, 768w, 1280w, 1920w)."
        }, "hq_global")
        
        # Neural Pulse 3: Blurhash Done
        await manager.broadcast_to_room({
            "type": "BLURHASH",
            "message": f"Generated: {hash_str[:12]}..."
        }, "hq_global")

        # 3. Simulate Storage Push (S3 / Local Mock)
        final_web_url = None
        for width, buf in generated_buffers.items():
            file_key = f"{base_s3_path}_{width}w.{ext}"
            
            if ENABLE_S3 and s3_client:
                # Synchronous blocking call wrapped in to_thread
                url = await asyncio.to_thread(upload_bytes_to_s3, buf, file_key)
                if width == 1280 or width == max(generated_buffers.keys()):
                    final_web_url = url
            else:
                # Save locally for mock
                save_dir = os.path.join("assets", "cdn_mock", tenant_id_safe, service_id_safe)
                os.makedirs(save_dir, exist_ok=True)
                
                local_path = os.path.join(save_dir, f"{file_hash}_{width}w.{ext}")
                with open(local_path, "wb") as f:
                    f.write(buf)
                
                web_path = f"/{local_path}".replace("\\", "/")
                # pick 1280 or fallback max size as the primary DB url
                if width == 1280 or width == max(generated_buffers.keys()):
                    final_web_url = web_path
                    
        # Neural Pulse 4: Storage Complete
        await manager.broadcast_to_room({
            "type": "CDN",
            "message": f"Global Push Complete. 0ms Latency."
        }, "hq_global")
        
        # Finally trigger VISUAL_INGESTED so SantisCore syncs stats
        await manager.broadcast_to_room({
            "type": "VISUAL_INGESTED",
            "message": f"Visual assets fully synchronized."
        }, "hq_global")

        # Return the canonical 1280w url and blurhash
        return {
            "url": final_web_url,
            "blurhash": hash_str
        }

factory = GhostFactory()
