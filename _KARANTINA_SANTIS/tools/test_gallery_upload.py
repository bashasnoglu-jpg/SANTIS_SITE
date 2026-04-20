"""
tools/test_gallery_upload.py
Simulates a gallery upload to test the full pipeline.
"""
import asyncio
import os
from app.api.v1.endpoints.gallery import process_and_save_asset

async def main():
    # Use an existing test image
    test_files = [f for f in os.listdir("assets/img/uploads") if f.endswith(".jpg")]
    if not test_files:
        print("No test images found in assets/img/uploads/")
        return
    
    test_file = test_files[0]
    temp_path = os.path.join("assets/img/uploads", test_file)
    
    print(f"Testing with: {temp_path}")
    print(f"File exists: {os.path.exists(temp_path)}")
    
    # Simulate the same call the background task makes
    import uuid
    asset_id = str(uuid.uuid4())
    
    # Don't let finally block delete the file
    import shutil
    backup_path = temp_path + ".backup"
    shutil.copy2(temp_path, backup_path)
    
    try:
        await process_and_save_asset(
            asset_id=asset_id,
            temp_path=backup_path,
            filename=test_file,
            category="hamam",
            linked_service_id=None,
            caption_tr="Test Upload",
            caption_en="Test Upload",
            caption_de="Test Upload",
            sort_order=0,
            tenant_id="373b8999-d833-40ef-9dd1-eef5ecb37d69"
        )
    except Exception as e:
        import traceback
        print(f"EXCEPTION: {e}")
        traceback.print_exc()
    
    # Check DB
    from app.db.session import AsyncSessionLocal
    from app.db.models.gallery import GalleryAsset
    from sqlalchemy import select
    
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(GalleryAsset))
        items = res.scalars().all()
        print(f"\nTotal assets in DB after test: {len(items)}")
        for i in items:
            print(f"  ID={i.id[:8]}  cat={i.category}  file={i.filename}")

asyncio.run(main())
