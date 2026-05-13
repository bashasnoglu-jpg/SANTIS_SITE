import { audioShield } from "./SovereignAudioEngine";

export const generateStrategicReport = (auditLog: any[], currentScore: number) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Raporun istatistiksel özeti
  const stats = {
    totalActions: auditLog.length,
    autoApplied: auditLog.filter(l => l.status === 'SYSTEM_AUTO_APPLY').length,
    manualApprovals: auditLog.filter(l => l.status === 'APPROVED').length,
    preventedDisasters: auditLog.filter(l => l.status === 'DISMISSED').length,
    finalStability: currentScore
  };

  const reportData = {
    header: "SOVEREIGN OS - STRATEGIC COMMAND MANIFEST",
    generatedAt: new Date().toLocaleString(),
    systemMetrics: {
      sovereigntyIndex: `${currentScore}%`,
      status: currentScore > 80 ? 'OPTIMAL' : currentScore > 50 ? 'STABLE' : 'CRITICAL'
    },
    performanceStats: stats,
    detailedLedger: auditLog
  };

  // Dosya indirme işlemi (JSON formatında)
  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Sovereign_Manifest_${timestamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  audioShield.speak("Manifest generated, Admin. State secured.");
};
