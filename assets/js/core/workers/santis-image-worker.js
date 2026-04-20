// santis-image-worker.js

// Worker kendi bağlamında (self) dinlemede kalır
self.onmessage = async function(event) {
  const { file, options, jobId } = event.data;

  try {
    // 1. Dosyayı doğrudan bellekte bitmap'e çevir (Çok hızlıdır)
    const imageBitmap = await createImageBitmap(file);
    
    // 2. Boyutlandırma mantığı (Örn: Maksimum genişlik 1920px)
    const maxWidth = options.maxWidth || 1920;
    let width = imageBitmap.width;
    let height = imageBitmap.height;

    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }

    // 3. OffscreenCanvas oluştur (DOM'a bağımlı olmayan karanlık tuval)
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 4. Görseli yeni boyutlarıyla tuvale çiz
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    // 5. Tuvali istenen kalitede yeni bir Blob'a (Dosya formatına) çevir
    const compressedBlob = await canvas.convertToBlob({
      type: options.type || 'image/jpeg',
      quality: options.quality || 0.8
    });

    // 6. İşlenmiş veriyi Main Thread'e geri gönder
    self.postMessage({
      status: 'SUCCESS',
      jobId: jobId,
      payload: {
        blob: compressedBlob,
        originalSize: file.size,
        newSize: compressedBlob.size,
        compressionRatio: ((1 - (compressedBlob.size / file.size)) * 100).toFixed(2)
      }
    });

    // Bellek temizliği (Memory Leak'i önlemek için)
    imageBitmap.close();

  } catch (error) {
    self.postMessage({
      status: 'ERROR',
      jobId: jobId,
      error: error.message
    });
  }
};
