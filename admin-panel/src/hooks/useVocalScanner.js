import { useState, useRef, useCallback, useLayoutEffect } from 'react';

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
  // processAudioRef: "latest ref" pattern — useLayoutEffect içinde güncellenir,
  // render sonrası senkron çalışır (react-hooks/refs kuralına uygun).
  const processAudioRef = useRef(null);

  const processAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sumSquares = 0;
    let highFreqSum = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const amplitude = dataArray[i];
      sumSquares += amplitude * amplitude;
      if (i > dataArray.length / 2) {
        highFreqSum += amplitude;
      }
    }

    const rms = Math.sqrt(sumSquares / dataArray.length);
    const highFreqAverage = highFreqSum / (dataArray.length / 2);

    if (rms > 5) {
      const rawStress = (highFreqAverage * 1.5) + (rms * 0.5);
      const normalizedStress = Math.min(100, Math.max(0, rawStress));
      setCortisolScore(prev => prev * 0.9 + normalizedStress * 0.1);
    } else {
      setCortisolScore(prev => Math.max(0, prev - 1.0));
    }

    // Döngüyü devam ettir — ref wrapper kullan, stable callback referansı
    requestRef.current = requestAnimationFrame(processAudioRef.current);
  }, []);

  // processAudioRef'i her render sonrası senkron güncelle (useLayoutEffect: DOM mutasyonu sonrası, paint öncesi)
  // react-hooks/refs: ref.current mutaşyonu render dışında olmalı — useLayoutEffect bunu sağlar.
  useLayoutEffect(() => {
    processAudioRef.current = processAudio;
  });

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
