// components/MatrixImage.jsx
import React, { useState } from 'react';

// Çevre değişkeninden gelen Edge Domain'imiz
const MATRIX_DOMAIN = 'https://matrix.sovereign.os';

export default function MatrixImage({ objectKey, width, quality = 80, alt = 'Sovereign Asset' }) {
    const [isLoaded, setIsLoaded] = useState(false);

    // Ziyaretçinin ekran yoğunluğuna göre (Retina ekranlar için 2x çözünürlük)
    const src = `${MATRIX_DOMAIN}/${objectKey}?w=${width}&q=${quality}`;
    const srcSet = `${MATRIX_DOMAIN}/${objectKey}?w=${width * 2}&q=${quality} 2x`;

    return (
        <div style={{
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#111', // Karanlık yükleme zemin 
            width: '100%',
            height: '100%'
        }}>
            {/* İsteğe bağlı: Burada düşük kaliteli (blur=20) bir placeholder da kullanılabilir */}

            <img
                src={src}
                srcSet={srcSet}
                alt={alt}
                onLoad={() => setIsLoaded(true)}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: isLoaded ? 1 : 0,
                    transition: 'opacity 0.4s ease-in-out', // Siberpunk Fade-in
                    filter: isLoaded ? 'none' : 'blur(10px)',
                }}
                loading="lazy" // Tarayıcı sadece ekrana girdiğinde çeker
                decoding="async" // Main thread'i tıkamaz
            />
        </div>
    );
}
