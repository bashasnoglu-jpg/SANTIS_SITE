import React, { useState, useEffect } from 'react';
import { useSovereignSocket } from '../../context/SovereignSocketContext.js';
import { ArchiveLogSchema } from '../../contracts/sovereign-schemas';
import { z } from 'zod';
import { History, ShieldCheck, Zap, Lock } from 'lucide-react';

/**
 * Sovereign Archive (Tarihsel Hafıza) Bileşeni
 * Sistemde gerçekleşen kritik stratejik eylemleri kronolojik bir zaman tüneli olarak sunar.
 */
export default function SovereignArchive() {
  const { socket } = useSovereignSocket();
  const [archiveLogs, setArchiveLogs] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Bileşen yüklendiğinde mevcut arşivi talep et
    socket.emit('admin:request_archive');

    socket.on('admin:archive_sync', (rawData) => {
      try {
        // Gelen diziyi Zod ile doğruluyoruz
        const validatedData = z.array(ArchiveLogSchema).parse(rawData);
        setArchiveLogs(validatedData);
      } catch (error) {
        console.error('🛡️ Sovereign Guard: Geçersiz arşiv verisi.', error);
      }
    });

    return () => socket.off('admin:archive_sync');
  }, [socket]);

  const getIcon = (type) => {
    switch (type) {
      case 'STRATEGY_EXECUTION': return <Zap size={14} className="text-santis-gold" />;
      case 'CRITICAL_ALERT': return <ShieldCheck size={14} className="text-red-400" />;
      case 'REALITY_LOCK': return <Lock size={14} className="text-emerald-400" />;
      default: return <History size={14} />;
    }
  };

  return (
    <div className="bg-black/30 backdrop-blur-xl border border-white/5 p-8 rounded-3xl mt-8">
      <h3 className="flex items-center gap-3 text-white font-serif text-xl tracking-wide mb-8">
        <History className="text-santis-gold" size={24} />
        Sovereign Archive (Tarihsel Hafıza)
      </h3>

      {archiveLogs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl">
          <p className="text-white/30 text-sm italic">Kayıtlı stratejik eylem bulunamadı.</p>
        </div>
      ) : (
        <div className="relative border-l border-white/10 pl-8 ml-2 space-y-8">
          {archiveLogs.map((log) => (
            <div key={log.id} className="relative group">
              {/* Timeline Indicator */}
              <div className="absolute -left-[37px] top-1 w-4 h-4 bg-black border border-santis-gold/50 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(198,169,107,0.3)] group-hover:scale-125 transition-transform">
                {getIcon(log.type)}
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">
                  {new Date(log.timestamp).toLocaleString('tr-TR')}
                </span>
                <h4 className="text-white/90 text-sm font-medium tracking-wide group-hover:text-santis-gold transition-colors">
                  {log.description}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                    <div className="px-2 py-0.5 bg-santis-gold/10 border border-santis-gold/20 rounded text-[9px] text-santis-gold uppercase tracking-tighter">
                        Etki Analizi
                    </div>
                    <p className="text-emerald-400/80 text-[11px] font-light italic">
                        {log.impact}
                    </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
