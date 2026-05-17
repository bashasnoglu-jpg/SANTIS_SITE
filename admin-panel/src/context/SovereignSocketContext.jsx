import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { RadarEventSchema, FinancialDataSchema, PricingDecisionSchema, PredictionEventSchema } from '../contracts/sovereign-schemas';

const SovereignSocketContext = createContext(null);

/**
 * Sovereign Socket Provider
 * SSOT (Single Source of Truth) ve Runtime Contract Validation merkezi.
 * Tüm socket trafiğini yönetir ve Zod ile doğrulanmış veriyi dağıtır.
 */
export const SovereignSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [radarData, setRadarData] = useState(null);
  const [financeData, setFinanceData] = useState({ liveRevenue: 0, activeSessions: 0 });
  const [pricingLogs, setPricingLogs] = useState([]);
  const [predictionData, setPredictionData] = useState(null);

  useEffect(() => {
    const s = io('http://localhost:3030');
    setSocket(s);

    // 1. Radar Doğrulaması
    s.on('admin:radar_update', (raw) => {
      try {
        const validated = RadarEventSchema.parse(raw);
        setRadarData(validated);
      } catch (e) {
        console.error('🚨 [Sovereign Contract Breach] Radar Data rejected:', e.errors);
      }
    });

    // 2. Finansal Veri Doğrulaması
    s.on('admin:finance_update', (raw) => {
      try {
        const validated = FinancialDataSchema.parse(raw);
        setFinanceData(validated);
      } catch (e) {
        console.error('🚨 [Sovereign Contract Breach] Finance Data rejected:', e.errors);
      }
    });

    // 3. Strateji / Fiyatlandırma Doğrulaması
    s.on('public:pricing_update', (raw) => {
      try {
        const validated = PricingDecisionSchema.parse(raw);
        setPricingLogs((prev) => {
          const newLog = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString('tr-TR'),
            ...validated
          };
          return [newLog, ...prev].slice(0, 8);
        });
      } catch (e) {
        console.error('🚨 [Sovereign Contract Breach] Pricing Decision rejected:', e.errors);
      }
    });

    // 4. Öngörü (Prediction) Doğrulaması
    s.on('admin:prediction_update', (raw) => {
      try {
        const validated = PredictionEventSchema.parse(raw);
        setPredictionData(validated);
      } catch (e) {
        console.error('🚨 [Sovereign Contract Breach] Prediction Data rejected:', e.errors);
      }
    });

    return () => s.disconnect();
  }, []);

  return (
    <SovereignSocketContext.Provider value={{ socket, radarData, financeData, pricingLogs, predictionData }}>
      {children}
    </SovereignSocketContext.Provider>
  );
};

export const useSovereignSocket = () => {
  const context = useContext(SovereignSocketContext);
  if (!context) throw new Error("useSovereignSocket must be used within SovereignSocketProvider");
  return context;
};
