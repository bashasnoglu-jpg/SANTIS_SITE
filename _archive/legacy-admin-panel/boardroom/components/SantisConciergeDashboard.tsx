import React, { useState, useEffect } from 'react';
import { Activity, ArrowDown, BarChart3, Users, Zap } from 'lucide-react';

import { audioShield } from './SovereignAudioEngine';

// --- Tipler ---
export interface TelemetryData {
  experience: number;  // Toplam etkileşim
  conversion: number;  // Dönüşen kullanıcılar
  insight: number;     // Elde edilen veri noktası
  dropRate: number;    // Terk etme oranı (%)
  timestamp: string;
}

export interface LeadEvent {
  id: string;
  source: string;
  action: string;
  status: 'success' | 'warning';
}

// --- Action Engine Protokolü ---
const triggerActionEngine = async (currentDropRate: number) => {
  console.warn(`[ACTION ENGINE] Kritik Eşik Aşıldı: %${currentDropRate}`);
  
  // 1. İşitsel Uyarı (SovereignAudioEngine)
  audioShield.playDangerAlert();

  // 2. Auto-Heal Mekanizması (API Call)
  try {
    const response = await fetch('http://localhost:8080/api/v1/telemetry/action/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId: 'system_auto_heal_dropoff' })
    });
    
    if (response.ok) {
      console.log("✅ [AUTO-HEAL] Front-End Sinyali Başarılı. Sistem Optimizasyonu Başlatıldı.");
      // Soft Chime çalınabilir
      setTimeout(() => audioShield.playSoftChime(), 1000);
    }
  } catch (error) {
    console.error("❌ [ACTION ENGINE] Müdahale başarısız:", error);
  }
};

// --- Dashboard Bileşeni ---
export const SantisConciergeDashboard: React.FC = () => {
  const [data, setData] = useState<TelemetryData>({
    experience: 0, conversion: 0, insight: 0, dropRate: 0, timestamp: ''
  });
  const [leads, setLeads] = useState<LeadEvent[]>([]);
  const [isAlertActive, setIsAlertActive] = useState(false);

  // 1. Veri Çekme Mekanizması (Polling)
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const mockResponse: TelemetryData = {
          experience: Math.floor(Math.random() * 500) + 1000,
          conversion: Math.floor(Math.random() * 200) + 400,
          insight: Math.floor(Math.random() * 50) + 100,
          dropRate: parseFloat((Math.random() * 5 + 5).toFixed(2)), // Daha tutarlı oranlar
          timestamp: new Date().toLocaleTimeString(),
        };
        setData(mockResponse);

        const newLead: LeadEvent = {
          id: Math.random().toString(36).substr(2, 9).toUpperCase(),
          source: 'Telemetry_Alpha',
          action: 'Conversion_Success',
          status: 'success'
        };
        setLeads(prev => [newLead, ...prev].slice(0, 5));
      } catch (error) {
        console.error("Telemetry Error:", error);
      }
    };

    const interval = setInterval(fetchTelemetry, 4000); 
    return () => clearInterval(interval);
  }, []);

  // 2. Karar Döngüsü (Drop-off %10'u aşarsa)
  useEffect(() => {
    if (data.dropRate > 10 && !isAlertActive) {
      setIsAlertActive(true);
      triggerActionEngine(data.dropRate);
      
      setTimeout(() => setIsAlertActive(false), 30000);
    }
  }, [data.dropRate, isAlertActive]);

  return (
    <div className={`p-6 bg-slate-950 text-slate-100 min-h-screen font-sans border-t border-slate-800 rounded-b-xl mt-8 transition-colors duration-500 rounded-t-xl ${isAlertActive ? 'ring-2 ring-red-500/50 shadow-[inset_0_0_50px_rgba(239,68,68,0.1)]' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-blue-400">SANTIS CONCIERGE</h1>
          <p className="text-slate-500 text-sm italic underline decoration-blue-500/30">
            Operational Intelligence Loop: Experience → Conversion → Insight
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
          <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
          <span className="text-xs font-mono">{data.timestamp} - LIVE</span>
        </div>
      </div>

      {/* Ana Metrikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <MetricCard title="Experiences" value={data.experience} icon={<Users />} color="text-blue-400" />
        <MetricCard title="Conversions" value={data.conversion} icon={<Zap />} color="text-yellow-400" />
        <MetricCard title="Insights" value={data.insight} icon={<BarChart3 />} color="text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operasyonel Huni (Funnel) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <ArrowDown className="w-5 h-5 text-blue-500" /> Conversion Funnel
          </h3>
          <div className="space-y-4">
            <FunnelStep label="Experience" count={data.experience} total={data.experience} color="bg-blue-600" />
            <FunnelStep label="Conversion" count={data.conversion} total={data.experience} color="bg-yellow-600" />
            <FunnelStep label="Insight" count={data.insight} total={data.experience} color="bg-emerald-600" />
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <span className="text-sm text-slate-400">Genel Kayıp Oranı: </span>
            <span className="text-red-400 font-mono">%{data.dropRate}</span>
          </div>
        </div>

        {/* Canlı Akış (Lead Flow) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">Real-time Lead Flow</h3>
          <div className="space-y-3">
            {leads.map(lead => (
              <div key={lead.id} className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-800 text-sm">
                <span className="font-mono text-blue-300">{lead.id}</span>
                <span className="text-slate-400">{lead.source}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                  lead.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {lead.action}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Alt Bileşenler ---

const MetricCard = ({ title, value, icon, color }: { title: string, value: number, icon: any, color: string }) => (
  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-blue-500/50 transition-colors">
    <div className="flex justify-between items-start">
      <p className="text-slate-400 text-sm font-medium">{title}</p>
      <div className={`${color} opacity-80`}>{icon}</div>
    </div>
    <p className={`text-2xl font-bold mt-2 font-mono ${color}`}>{value.toLocaleString()}</p>
  </div>
);

const FunnelStep = ({ label, count, total, color }: { label: string, count: number, total: number, color: string }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1 uppercase tracking-widest text-slate-500 font-bold">
        <span>{label}</span>
        <span>{count}</span>
      </div>
      <div className="w-full bg-slate-800 h-8 rounded overflow-hidden relative">
        <div 
          className={`${color} h-full transition-all duration-1000 ease-in-out flex items-center px-4`}
          style={{ width: `${percentage}%` }}
        >
          <span className="text-xs font-bold text-white shadow-sm">%{percentage.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
};

export default SantisConciergeDashboard;
