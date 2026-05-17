import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import {
  RadarEventSchema,
  FinancialDataSchema,
  PricingDecisionSchema,
  PredictionEventSchema,
} from '../contracts/sovereign-schemas';
import { SovereignSocketContext } from './SovereignSocketContext';

export function SovereignSocketProvider({ children }) {
  const socketRef = useRef(null);

  const [radarData, setRadarData] = useState(null);
  const [financeData, setFinanceData] = useState({
    liveRevenue: 0,
    activeSessions: 0,
  });
  const [pricingLogs, setPricingLogs] = useState([]);
  const [predictionData, setPredictionData] = useState(null);

  useEffect(() => {
    const socket = io('http://localhost:3030');
    socketRef.current = socket;

    socket.on('admin:radar_update', (raw) => {
      try {
        const validated = RadarEventSchema.parse(raw);
        setRadarData(validated);
      } catch (e) {
        console.error('🚨 [Sovereign Contract Breach] Radar Data rejected:', e.errors);
      }
    });

    socket.on('admin:finance_update', (raw) => {
      try {
        const validated = FinancialDataSchema.parse(raw);
        setFinanceData(validated);
      } catch (e) {
        console.error('🚨 [Sovereign Contract Breach] Finance Data rejected:', e.errors);
      }
    });

    socket.on('public:pricing_update', (raw) => {
      try {
        const validated = PricingDecisionSchema.parse(raw);

        setPricingLogs((prev) => {
          const newLog = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString('tr-TR'),
            ...validated,
          };

          return [newLog, ...prev].slice(0, 8);
        });
      } catch (e) {
        console.error('🚨 [Sovereign Contract Breach] Pricing Decision rejected:', e.errors);
      }
    });

    socket.on('admin:prediction_update', (raw) => {
      try {
        const validated = PredictionEventSchema.parse(raw);
        setPredictionData(validated);
      } catch (e) {
        console.error('🚨 [Sovereign Contract Breach] Prediction Data rejected:', e.errors);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      radarData,
      financeData,
      pricingLogs,
      predictionData,
    }),
    [radarData, financeData, pricingLogs, predictionData],
  );

  return (
    <SovereignSocketContext.Provider value={value}>
      {children}
    </SovereignSocketContext.Provider>
  );
}
