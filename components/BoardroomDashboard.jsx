import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, Legend, LineChart, Line
} from 'recharts';
import LiveFeedTicker from './LiveFeedTicker';

/**
 * BoardroomDashboard: Üst düzey yönetici analitik paneli
 * Veri Kaynağı: Postgres sovereign_stress_heatmap view
 */
const BoardroomDashboard = ({ data }) => {
    // Örnek Veri Yapısı (Postgres view'ından gelen formata uygun)
    const defaultData = [
        { category: 'Düşük Stres (<%50)', sessions: 120, sales: 12, conversion: 10 },
        { category: 'Orta Stres (%50-79)', sessions: 85, sales: 42, conversion: 49.4 },
        { category: 'Kritik Stres (%80+)', sessions: 45, sales: 38, conversion: 84.4 },
    ];

    const chartData = data || defaultData;

    return (
        <div className="bg-[#141416] p-10 min-h-screen text-[#c6a96b]">
            {/* Başlık Bölümü */}
            <div className="flex justify-between items-end mb-12 border-b border-[#c6a96b]/20 pb-6">
                <div>
                    <h2 className="text-[10px] tracking-[0.5em] uppercase opacity-50">Sovereign Division</h2>
                    <h1 className="text-3xl font-light tracking-tighter uppercase">Boardroom Shadow Analytics</h1>
                </div>
                <div className="text-right">
                    <span className="text-xs opacity-50 block">SİSTEM DURUMU</span>
                    <span className="text-green-500 text-sm font-mono animate-pulse">● CANLI VERİ AKIŞI</span>
                </div>
            </div>

            {/* Ana Metrikler */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="border border-[#c6a96b]/20 p-6 bg-[#1c1c1f]">
                    <span className="text-[10px] uppercase opacity-50 tracking-widest">Toplam Oturum</span>
                    <div className="text-4xl font-semibold mt-2">250</div>
                </div>
                <div className="border border-[#c6a96b]/20 p-6 bg-[#1c1c1f]">
                    <span className="text-[10px] uppercase opacity-50 tracking-widest">Genel Dönüşüm Oranı</span>
                    <div className="text-4xl font-semibold mt-2 text-white">%36.8</div>
                </div>
                <div className="border border-[#c6a96b]/20 p-6 bg-[#1c1c1f]">
                    <span className="text-[10px] uppercase opacity-50 tracking-widest">En Yüksek Kapanış Eşiği</span>
                    <div className="text-4xl font-semibold mt-2">%80+ STRES</div>
                </div>
            </div>

            {/* Dönüşüm Isı Haritası (Grafik) */}
            <div className="bg-[#1c1c1f] border border-[#c6a96b]/20 p-8">
                <h3 className="text-sm tracking-widest uppercase mb-8 opacity-70">Stres vs. Satış Korelasyonu</h3>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2d" vertical={false} />
                            <XAxis
                                dataKey="category"
                                stroke="#c6a96b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#c6a96b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `%${val}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1c1c1f', border: '1px solid #c6a96b', color: '#c6a96b' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="conversion" name="Dönüşüm Oranı" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.conversion > 70 ? '#ff4d4d' : entry.conversion > 40 ? '#c6a96b' : '#4d4d4d'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="mt-8 text-[10px] text-zinc-600 font-mono italic">
                * Veriler, V28 Kuantum Tarayıcı telemetrisinden otonom olarak dökülmektedir.
            </div>

            {/* Alt Kısım: Live Feed Ticker */}
            <div className="mt-12">
                <LiveFeedTicker />
            </div>
        </div>
    );
};

export default BoardroomDashboard;
