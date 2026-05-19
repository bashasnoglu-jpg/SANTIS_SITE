import { createContext, useContext } from 'react';

export const SovereignSocketContext = createContext(null);

export function useSovereignSocket() {
  const context = useContext(SovereignSocketContext);

  if (!context) {
    throw new Error('useSovereignSocket must be used within SovereignSocketProvider');
  }

  return context;
}
