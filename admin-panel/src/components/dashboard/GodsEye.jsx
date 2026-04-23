import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Eye, Activity, Users } from 'lucide-react';
import StatCard from './StatCard';

const GodsEye = () => {
  const [activeUsers, setActiveUsers] = useState(0);
  const [viewingServices, setViewingServices] = useState([]);

  useEffect(() => {
    // Sadece Admin yetkisiyle Karargah'a baglan
    const adminSocket = io(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8080' : '/');

    adminSocket.on('admin:radar_update', (ghosts) => {
      setActiveUsers(ghosts.length);
      const currentServices = ghosts.map(g => g[1].service);
      setViewingServices(currentServices);
    });

    return () => adminSocket.disconnect();
  }, []);

  const hotService = viewingServices.length > 0 ? viewingServices[0] : 'Radar Sessiz';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border border-santis-gold/20 p-6 rounded-xl bg-black/60 relative overflow-hidden fx-glow-soft-gold">
      <div className="absolute top-0 left-0 w-full fx-divider-hairline-gold"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[30px] bg-santis-gold/20 blur-[30px] rounded-full"></div>
      
      <div className="md:col-span-2 mb-2 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-widest flex items-center gap-3 uppercase">
          <Eye className="text-santis-gold animate-pulse fx-glow-medium-gold rounded-full" size={24} />
          The God's Eye
        </h2>
        <span className="text-2xs text-santis-gold border border-santis-gold/30 bg-santis-gold/10 px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
          Live Radar
        </span>
      </div>

      <StatCard 
        title="Canlı Ziyaretçi" 
        value={activeUsers.toString()} 
        icon={Users}
        color={activeUsers > 0 ? "text-santis-gold" : "text-santis-muted"}
        trend={activeUsers > 0 ? "up" : null}
        trendValue={activeUsers > 0 ? "Radar Aktif" : "Sinyal Beklenmiyor"}
      />
      
      <StatCard 
        title="En Sıcak Ritüel" 
        value={hotService.replace('massage-', '').replace(/-/g, ' ').toUpperCase()} 
        icon={Activity} 
        color={viewingServices.length > 0 ? "text-red-500 animate-pulse" : "text-santis-muted"} 
        trend={viewingServices.length > 0 ? "up" : null}
        trendValue={viewingServices.length > 0 ? "Sıcak Satış Fırsatı" : ""}
      />
    </div>
  );
};

export default GodsEye;
