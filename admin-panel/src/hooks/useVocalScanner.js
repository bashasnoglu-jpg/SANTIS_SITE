import { useState, useRef, useCallback } from 'react';

// ----------------------------------------------------------------------
// BİYOMETRİK SENSÖR (Web Audio API)
// Hastanın vokal verilerini (FFT) okuyan deterministik veri hortumu
// ----------------------------------------------------------------------

export const useVocalScanner = () => {
  const [isListening, setIsListening] = useState(false);
  const [cortisolScore, setCortisolScore] = useState(0);
  const [error, setError] = useState(null);

  // Ses işlemcilerini referans olarak tutuyoruz (React re-render döngüsünden korumak için)
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const requestRef = useRef(null);

  // Analiz Döngüsü: Her karesinde sesi okur ve stresi hesaplar
  const processAudio = useCallback(() => {
    if (!analyserRef.current) return;

    // Frekans verisini alacağımız diziyi oluştur
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // RMS (Root Mean Square) - Ses şiddetinin (Volume) genel hesaplaması
    let sumSquares = 0;
    // Yüksek frekansların (stres/titreme belirtisi) toplamı
    let highFreqSum = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const amplitude = dataArray[i];
      sumSquares += amplitude * amplitude;
      
      // Frekans spektrumunun üst yarısını "yüksek frekans" olarak kabul et (Biyobelirteç simülasyonu)
      if (i > dataArray.length / 2) {
        highFreqSum += amplitude;
      }
    }

    const rms = Math.sqrt(sumSquares / dataArray.length);
    const highFreqAverage = highFreqSum / (dataArray.length / 2);

    // Stres/Kortizol Puanı Algoritması (0-100 arası)
    // Ses şiddeti (rms) ve yüksek frekans titremelerinin (highFreqAverage) kombinasyonu
    // Sessizlikte 0 kalması için bir eşik değeri (threshold) uyguluyoruz
    if (rms > 5) {
      // Çarpanlar UHNWI hedef kitlesinin reaksiyon hassasiyetine göre ayarlanmıştır
      const rawStress = (highFreqAverage * 1.5) + (rms * 0.5);
      const normalizedStress = Math.min(100, Math.max(0, rawStress));
      
      // Ani sıçramaları önlemek için eski değerle yeni değeri harmanla (Lerp mantığı)
      setCortisolScore(prev => prev * 0.9 + normalizedStress * 0.1);
    } else {
      // Kullanıcı konuşmuyorsa stres seviyesi yavaşça düşer (Parasempatik simülasyon)
      setCortisolScore(prev => Math.max(0, prev - 1.0));
    }

    // Döngüyü 60 FPS hızında devam ettir
    requestRef.current = requestAnimationFrame(processAudio);
  }, []);

  // Sensörü Ateşle
  const startScan = async () => {
    try {
      setError(null);
      // Mikrofon izni iste
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      
      // AudioContext başlat (Modern tarayıcılarda kullanıcı etkileşimi sonrası başlatılabilir)
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      // Analyser Node oluştur (FFT boyutu 512, yani 256 frekans bandı okuyacağız)
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.8; // Geçişleri yumuşat

      // Mikrofonu Analyser'a bağla
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      setIsListening(true);
      processAudio();

    } catch (err) {
      console.error("Sensör Hatası: Mikrofon izni reddedildi veya donanım bulunamadı.", err);
      setError("Akustik sensörlere erişilemiyor. Lütfen mikrofon yetkilerini onaylayın.");
    }
  };

  // Sensörü Kapat
  const stopScan = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    
    setIsListening(false);
    setCortisolScore(0);
  };

  return { isListening, cortisolScore, startScan, stopScan, error };
};
