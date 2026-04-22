import { useState, useRef, useCallback } from 'react';

// ----------------------------------------------------------------------
// ETİK SENSÖR PROTOKOLÜ (Voice Visualizer)
// Yalnızca sesin enerjisini okur. Teşhis yapmaz, veri kaydetmez.
// Çıktı: 0.0 ile 1.0 arası yumuşatılmış görsel yoğunluk değeri (visualIntensity)
// ----------------------------------------------------------------------

export const useVoiceVisualizer = () => {
  const [isListening, setIsListening] = useState(false);
  const [visualIntensity, setVisualIntensity] = useState(0); 

  // Referanslar (React render döngüsünü yormamak için donanım köprüleri)
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const requestRef = useRef(null);

  // Analiz Döngüsü: Saniyede 60 kez sesin enerjisini okur
  const processAudio = useCallback(function loop() {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Ses enerjisini (RMS - Root Mean Square) hesapla
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);

    // Enerjiyi 0.0 ile 1.0 arasına normalize et
    // (Bölen değeri 100 olarak tuttuk ki, normal konuşma sesinde zarif bir dalgalanma olsun)
    const normalizedEnergy = Math.min(1, rms / 100);

    // KİNETİK YUMUŞATMA (Lerp)
    // Değerlerin aniden sıçramasını engeller. Arayüze "nefes alma" hissi verir.
    setVisualIntensity(prev => prev * 0.85 + normalizedEnergy * 0.15);

    // Frame döngüsünü devam ettir
    requestRef.current = requestAnimationFrame(loop);
  }, []);

  const startListening = async () => {
    try {
      // Şeffaf izin talebi
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContext();

      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      // Web Audio API'nin kendi içinde de dalgalanmaları %90 oranında yumuşatmasını sağlıyoruz
      analyserRef.current.smoothingTimeConstant = 0.9; 

      sourceRef.current = audioCtxRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      setIsListening(true);
      processAudio();

    } catch (error) {
      console.error("[Sistem Uyarı]: Mikrofon erişimi sağlanamadı.", error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioCtxRef.current) audioCtxRef.current.close();

    setIsListening(false);
    setVisualIntensity(0); // Görselliği nazikçe sıfırla
  };

  return { isListening, visualIntensity, startListening, stopListening };
};
