import React, { useState } from 'react';
import { SovereignBookingFlow } from '../../../apps/web/src/components/SovereignBookingFlow';

export default function BookingTestPage() {
  const [step, setStep] = useState('idle');
  const [selectedId, setSelectedId] = useState(null);

  const packages = [
    { id: '1', name: 'Sovereign Hamam', durationMinutes: 60, description: 'Saf mermer ve buharın arındırıcı ritmi.', basePrice: 150 },
    { id: '2', name: 'Deep Tissue', durationMinutes: 90, description: 'Fiziksel blokajların otonom çözümü.', basePrice: 200 }
  ];

  const handleEvent = (event) => {
    if (event.type === 'SELECT_PACKAGE') setSelectedId(event.packageId);
    if (event.type === 'CONFIRM_INTENT') console.log('Intent confirmed.');
  };

  return (
    <SovereignBookingFlow 
      currentStep={step}
      availablePackages={packages}
      selectedPackageId={selectedId}
      sendEvent={handleEvent}
    />
  );
}
