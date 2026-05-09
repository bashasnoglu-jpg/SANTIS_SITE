// components/GodsEyeDashboard.jsx
import React from 'react';
import { useSovereignRadar } from '../hooks/useSovereignRadar';
import './GodsEye.css';

export default function GodsEyeDashboard() {
    const { threats, degradations, streams } = useSovereignRadar();

    return (
        <div className="gods-eye-wrapper">

            {/* SOL: Zayıflama İstihbaratı */}
            <div className="panel deg-panel">
                <h2 className="panel-title">[WARN] DEGRADATION FEED</h2>
                {degradations.length === 0 && <span style={{ opacity: 0.5 }}>Monitoring sub-optimal protocols...</span>}

                {degradations.map(deg => (
                    <div key={deg.id} className="deg-card">
                        <div><strong>VISITOR:</strong> {deg.client.visitorId}</div>
                        <div><strong>DEVICE:</strong> {deg.client.userAgent}</div>
                        <div style={{ marginTop: '5px' }}>{deg.payload.engineState} engaged.</div>
                    </div>
                ))}
            </div>

            {/* ORTA: Yörünge Veri Akışı (Ana Operasyon) */}
            <div className="panel orbital-panel">
                <h2 className="panel-title">[SYS] ORBITAL STREAM UPLINK</h2>
                {streams.length === 0 && <span style={{ opacity: 0.5 }}>Awaiting payload injection...</span>}

                {streams.map(stream => (
                    <div key={stream.fileId} className="stream-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>ID: {stream.visitorId} | FILE: {stream.fileId}</span>
                            <span>{stream.speed}</span>
                        </div>
                        <div className="stream-bar-bg">
                            <div className="stream-bar-fill" style={{ width: `${stream.percent}%` }}></div>
                        </div>
                        <div style={{ textAlign: 'right', marginTop: '5px', fontSize: '1.2rem', color: '#00ffcc' }}>
                            {stream.percent}%
                        </div>
                    </div>
                ))}
            </div>

            {/* SAĞ: Sıfır Güven Tehdit Radarı */}
            <div className="panel threat-panel">
                <h2 className="panel-title">[!] THREAT RADAR</h2>
                {threats.length === 0 && <span style={{ opacity: 0.5 }}>Zero-Trust Gate secure.</span>}

                {threats.map(threat => (
                    <div key={threat.id} className="threat-card">
                        <div><strong className="ip">HOST:</strong> {threat.client.ip} [{threat.client.visitorId}]</div>
                        <div style={{ margin: '5px 0' }}><strong>SPOOF:</strong> {threat.payload.spoofedName}</div>
                        <div><strong>HEX:</strong> {threat.payload.detectedHex} - {threat.payload.action}</div>
                    </div>
                ))}
            </div>

        </div>
    );
}
