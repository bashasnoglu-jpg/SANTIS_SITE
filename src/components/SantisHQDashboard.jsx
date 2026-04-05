import React, { useState, useEffect } from 'react';
import { Thermometer, User, AlertTriangle, Coffee, Sparkles, Droplets, Wind } from 'lucide-react';

import WebSocketManager from '../utils/WebSocketManager.js';

export default function SantisHQDashboard() {
  const [adminWS, setAdminWS] = useState(null);
  
  // Canlı Takvim ve Oda Durumları (WebSocket üzerinden anlık akar)
  const [rooms, setRooms] = useState([
    { 
      id: "h1", name: "VIP Fas Hamamı", temp: "38°C", humidity: "75%",
      currentSession: {
        guest: "Aylin Soylu",
        status: "in_progress", // in_progress, cleaning, available
        progress: 65, // Yüzde olarak geçen süre
        warnings: ["Lavanta Alerjisi!"],
        drink: "Matcha Çayı",
        endTime: "16:30"
      }
    },
    { 
      id: "s1", name: "Zümrüt Cilt Bakım", temp: "22°C", humidity: "40%",
      currentSession: {
        guest: null,
        status: "cleaning", // Algoritmanın otomatik attığı 10dk operasyonel pay (Cleanup Duration)
        progress: 10,
        warnings: [],
        drink: null,
        endTime: "15:50" 
      }
    },
    { 
      id: "m1", name: "Uzakdoğu Masaj", temp: "24°C", humidity: "45%",
      currentSession: {
        guest: null,
        status: "available",
        progress: 0,
        warnings: [],
        drink: null,
        endTime: null 
      }
    }
  ]);

  useEffect(() => {
    const wsUrl = window.location.protocol === 'https:' ? 'wss://localhost:8080/ws-admin' : 'ws://localhost:8080/ws-admin';
    const wsManager = new WebSocketManager('admin', wsUrl, {
      maxAttempts: 10,
      onMessage: (data) => {
        console.log("Admin Dashboard WebSocket veri aldı:", data);
        if (data.type === 'ROOMS_UPDATE' && Array.isArray(data.payload)) {
          setRooms(data.payload);
        }
      }
    });

    wsManager.connect();
    setAdminWS(wsManager);

    return () => {
      wsManager.destroy(); // Bileşen kalktığında sert cleanup devreye girer
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans selection:bg-[#D4AF37] selection:text-black">
      
      {/* HEADER: Saat ve Operasyon Özeti */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-[#D4AF37]/20 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-widest text-[#D4AF37] uppercase">Santis HQ</h1>
          <p className="text-sm text-gray-500 font-light mt-1">Canlı Operasyon, Guest DNA ve IoT İzleme Merkezi</p>
        </div>
        <div className="flex items-center gap-6 bg-[#0f0f11] px-6 py-3 rounded-2xl border border-white/5 shadow-lg">
          <div className="text-gray-400 text-sm text-right">
            <span className="block text-2xl text-white font-light">15:42</span>
            <span>15 Ekim Perşembe</span>
          </div>
          <div className="h-10 w-px bg-gray-800"></div>
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-light text-gray-300">Sistem Aktif (0 Çakışma)</span>
          </div>
        </div>
      </header>

      {/* ODA VE MİSAFİR KONTROL GRIDİ (Heatmap) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {rooms.map(room => (
          <div key={room.id} className="bg-[#0f0f11] rounded-2xl border border-white/5 p-6 hover:border-[#D4AF37]/30 transition-all duration-500 relative overflow-hidden group shadow-2xl">
            
            {/* Arka Plan İlerleme Çubuğu */}
            {room.currentSession.status === 'in_progress' && (
              <div 
                className="absolute top-0 left-0 h-1 bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37] transition-all duration-1000" 
                style={{ width: `${room.currentSession.progress}%` }}
              ></div>
            )}

            {/* Temizlik Modu Barı */}
            {room.currentSession.status === 'cleaning' && (
              <div className="absolute top-0 left-0 h-1 bg-blue-500/50 w-full animate-pulse"></div>
            )}

            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-light text-white flex items-center gap-2">
                  {room.name}
                  {room.currentSession.status === 'in_progress' && <Sparkles size={14} className="text-[#D4AF37]" />}
                </h2>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Thermometer size={12}/> {room.temp} (IoT)</span>
                  <span className="flex items-center gap-1"><Droplets size={12}/> {room.humidity}</span>
                </div>
              </div>

              {/* Durum Etiketi */}
              <div>
                {room.currentSession.status === 'in_progress' && (
                  <span className="px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] tracking-widest rounded-full border border-[#D4AF37]/30 uppercase shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                    Seansta ({room.currentSession.endTime})
                  </span>
                )}
                {room.currentSession.status === 'cleaning' && (
                  <span className="px-3 py-1 bg-blue-900/20 text-blue-400 text-[10px] tracking-widest rounded-full border border-blue-500/30 uppercase">
                    Oto-Temizlik Molası
                  </span>
                )}
                {room.currentSession.status === 'available' && (
                  <span className="px-3 py-1 bg-emerald-900/20 text-emerald-400 text-[10px] tracking-widest rounded-full border border-emerald-500/30 uppercase">
                    Müsait
                  </span>
                )}
              </div>
            </div>

            {/* MİSAFİR DNA KARTI (Eğer Oda Doluysa) */}
            {room.currentSession.status === 'in_progress' && (
              <div className="bg-black/60 rounded-xl p-4 border border-white/5 backdrop-blur-md mt-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/90">{room.currentSession.guest}</p>
                      <p className="text-[10px] text-[#D4AF37] uppercase tracking-wider">VIP DNA Yüklendi</p>
                    </div>
                  </div>
                  
                  {/* Lüks İkram */}
                  <div className="text-right flex items-center gap-2 text-xs text-[#D4AF37]/80">
                    <Coffee size={14} />
                    {room.currentSession.drink} 
                  </div>
                </div>

                {/* DNA Uyarıları (Alerji, Özel İstek) */}
                {room.currentSession.warnings.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-red-900/20 border border-red-500/30 flex items-start gap-3">
                    <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-200/90 font-light leading-relaxed">
                      <strong className="block mb-1 text-red-400 font-medium">IoT & Guest DNA Çakışması:</strong>
                      Misafirin <span className="uppercase font-semibold">{room.currentSession.warnings.join(', ')}</span> durumu var. Odanın havalandırma sisteminden bu esans otomatik engellendi. Okaliptüs devrede.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Temizlik veya Müsait Durum İçerikleri */}
            {room.currentSession.status === 'cleaning' && (
              <div className="flex flex-col items-center justify-center py-8 text-blue-300/50 mt-4">
                <Droplets size={32} className="mb-3 animate-bounce" />
                <p className="text-sm font-light">Yıkama & Havalandırma</p>
                <p className="text-xs mt-1 text-blue-400/60">Sistem Kilidi Açılış: {room.currentSession.endTime}</p>
              </div>
            )}

            {room.currentSession.status === 'available' && (
              <div className="flex flex-col items-center justify-center py-8 text-emerald-500/40 hover:text-emerald-500/60 transition-colors mt-4">
                <Wind size={32} className="mb-3" />
                <p className="text-sm font-light">Yeni Rezervasyonlara Açık</p>
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}
