import React, { useState, useRef, useCallback } from 'react';
import { ServiceAPI } from '../api/services';

export default function ServiceImageUpload({ currentImage, onImageUploaded }) {
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState(currentImage || null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFile = useCallback(async (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            return setError('Sadece görsel dosyaları (JPG/PNG/WEBP) kabul edilir.');
        }
        if (file.size > 5 * 1024 * 1024) {
            return setError("Dosya boyutu 5MB'ı aşamaz.");
        }

        setIsUploading(true);
        setError(null);
        setProgress(0);

        // Sunucuya gitmeden önce Local Preview (Hızlı geri bildirim)
        setPreview(URL.createObjectURL(file));

        try {
            const res = await ServiceAPI.uploadMedia(file, setProgress);
            if (res.success && res.path) {
                setPreview(res.path);
                onImageUploaded(res.path); // Parent forma (ServiceManager) CDN path'i yolla!
            }
        } catch (err) {
            console.error("Yükleme hatası:", err);
            setError(err.response?.data?.detail || "Görsel yüklenirken bir hata oluştu!");
            setPreview(currentImage); // Hatada eski resme dön
        } finally {
            setTimeout(() => { setIsUploading(false); setProgress(0); }, 1000); // Barı sıfırla ve gizle
        }
    }, [currentImage, onImageUploaded]);

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [handleFile]);

    return (
        <div className="w-full mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">Ritüel Görseli (Sovereign Oranı: 4/5)</label>
            <div
                className={`relative flex flex-col items-center justify-center w-full aspect-[4/5] max-h-80 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 overflow-hidden ${isDragging ? 'border-sovereign-gold-strong bg-sovereign-gold-strong/10' : 'border-gray-600 bg-sovereign-black hover:border-gray-400'
                    }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
            >
                {preview ? (
                    <>
                        <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                        {!isUploading && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <span className="text-white font-semibold">Görseli Değiştir</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
                        <svg className="w-12 h-12 mb-3 text-sovereign-gold-strong" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        <p className="mb-2 text-sm"><span className="font-semibold text-sovereign-gold-strong">Tıkla</span> veya Sürükle Bırak</p>
                        <p className="text-xs">WEBP, PNG, JPG (Maks. 5MB)</p>
                    </div>
                )}

                {/* İlerleme Çubuğu */}
                {isUploading && progress > 0 && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20">
                        <span className="text-sovereign-gold-strong font-bold text-3xl mb-4">{progress}%</span>
                        <div className="w-2/3 bg-gray-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-sovereign-gold-strong h-full transition-all duration-300 shadow-accent-glow" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                <input type="file" className="hidden" ref={fileInputRef} accept="image/jpeg, image/png, image/webp" onChange={(e) => handleFile(e.target.files[0])} />
            </div>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>
    );
}
